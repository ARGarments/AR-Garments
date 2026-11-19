import { NextRequest, NextResponse } from 'next/server';
import { BrevoApiError, BrevoConfigurationError, sendPasswordResetCode } from '@/lib/brevo';
import {
  EMAIL_LOGIN_CODE_TTL_MINUTES,
  EMAIL_LOGIN_RESEND_SECONDS,
  EmailLoginConfigurationError,
  generateEmailLoginCode,
  hashEmailLoginCode,
  InvalidEmailError,
  normalizeEmail,
} from '@/lib/emailLogin';
import { getServiceSupabase } from '@/lib/supabase';
import { memoryUsers } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_PURPOSE = 'password-reset';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const supabase = getServiceSupabase();

    // 1. Check if user exists in business_registrations or memoryUsers
    let foundUserName: string | null = null;
    let foundUserId: string | null = null;

    try {
      const { data: user, error: userError } = await supabase
        .from('business_registrations')
        .select('id, full_name, applicant_email, status')
        .eq('applicant_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!userError && user) {
        foundUserName = user.full_name || 'Business Partner';
        foundUserId = user.id;
      }
    } catch (e) {
      console.warn('Error reading business_registrations during password reset request:', e);
    }

    if (!foundUserId) {
      const memUser = memoryUsers.find((u) => u.email.toLowerCase() === email);
      if (memUser) {
        foundUserName = memUser.name || 'Business Partner';
        foundUserId = memUser.id;
      }
    }

    if (!foundUserId) {
      return NextResponse.json(
        {
          success: false,
          code: 'ACCOUNT_NOT_FOUND',
          error: 'No account exists with this email address. Please register first. / इस ईमेल पते से कोई खाता मौजूद नहीं है।',
        },
        { status: 404 }
      );
    }

    // 2. Cooldown check (prevent spamming)
    const cooldownStart = new Date(Date.now() - EMAIL_LOGIN_RESEND_SECONDS * 1000).toISOString();
    const { data: recentCode, error: recentCodeError } = await supabase
      .from('email_login_codes')
      .select('created_at')
      .eq('email', email)
      .eq('purpose', CODE_PURPOSE)
      .gte('created_at', cooldownStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentCodeError) {
      throw new Error(`Unable to check reset code cooldown: ${recentCodeError.message}`);
    }

    if (recentCode) {
      return NextResponse.json({
        success: true,
        message: 'A password reset code was already sent recently. Please check your inbox or wait before resending.',
        retryAfterSeconds: EMAIL_LOGIN_RESEND_SECONDS,
      });
    }

    // 3. Invalidate previous active password-reset codes for this email
    const { error: invalidateError } = await supabase
      .from('email_login_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('email', email)
      .eq('purpose', CODE_PURPOSE)
      .is('consumed_at', null);

    if (invalidateError) {
      throw new Error(`Unable to invalidate previous reset codes: ${invalidateError.message}`);
    }

    // 4. Generate & store new reset code
    const code = generateEmailLoginCode();
    const codeHash = hashEmailLoginCode(email, code);
    const expiresAt = new Date(Date.now() + EMAIL_LOGIN_CODE_TTL_MINUTES * 60 * 1000).toISOString();

    const { data: resetCodeRecord, error: insertError } = await supabase
      .from('email_login_codes')
      .insert({
        email,
        purpose: CODE_PURPOSE,
        code_hash: codeHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError || !resetCodeRecord) {
      throw new Error(`Unable to save password reset code: ${insertError?.message || 'No row returned'}`);
    }

    // 5. Send Email via Brevo
    try {
      const messageId = await sendPasswordResetCode({
        recipientEmail: email,
        recipientName: foundUserName || 'Business Partner',
        code,
        expiresInMinutes: EMAIL_LOGIN_CODE_TTL_MINUTES,
      });

      console.info('Brevo password reset code sent successfully', {
        userId: foundUserId,
        codeId: resetCodeRecord.id,
        messageId,
      });
    } catch (error) {
      // Clean up unsent code
      await supabase.from('email_login_codes').delete().eq('id', resetCodeRecord.id);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'A 6-digit password reset code has been sent to your email.',
      retryAfterSeconds: EMAIL_LOGIN_RESEND_SECONDS,
    });
  } catch (error) {
    if (error instanceof InvalidEmailError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof BrevoConfigurationError ||
      error instanceof EmailLoginConfigurationError
    ) {
      console.error('Email configuration error during password reset', { error: error.message });
      return NextResponse.json(
        { error: 'Email service is not configured on the server.' },
        { status: 500 }
      );
    }
    if (error instanceof BrevoApiError) {
      console.error('Brevo reset email failed', {
        status: error.status,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'The password reset email could not be sent. Please try again.' },
        { status: 502 }
      );
    }

    console.error('Password reset request failed', { error });
    return NextResponse.json({ error: 'Unable to send password reset code. Please try again.' }, { status: 500 });
  }
}
