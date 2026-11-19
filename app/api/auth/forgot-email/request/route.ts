import { NextRequest, NextResponse } from 'next/server';
import { BrevoApiError, BrevoConfigurationError, sendEmailChangeCode } from '@/lib/brevo';
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
import { verifyPassword, memoryUsers } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_PURPOSE = 'email-change';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawMobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rawNewEmail = body.newEmail;

    // 1. Validation
    const cleanMobile = rawMobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit registered mobile number.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Please enter your account password to verify ownership.' },
        { status: 400 }
      );
    }

    const newEmail = normalizeEmail(rawNewEmail);
    const last10Digits = cleanMobile.slice(-10);

    const supabase = getServiceSupabase();

    // 2. Find user in business_registrations by mobile number
    let foundUser: {
      id: string;
      full_name: string;
      applicant_email: string;
      mobile: string;
      password: string;
      status: string;
    } | null = null;

    try {
      const { data: users, error: lookupError } = await supabase
        .from('business_registrations')
        .select('id, full_name, applicant_email, mobile, password, status')
        .ilike('mobile', `%${last10Digits}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!lookupError && Array.isArray(users) && users.length > 0) {
        // Find the user whose password matches (or first if single)
        for (const u of users) {
          if (u.password && verifyPassword(password, u.password)) {
            foundUser = u;
            break;
          }
        }
        // If password didn't match any, keep first user reference so we can return "wrong password"
        if (!foundUser && users.length > 0) {
          return NextResponse.json(
            { error: 'Incorrect account password for this mobile number.' },
            { status: 401 }
          );
        }
      }
    } catch (e) {
      console.warn('Error querying business_registrations by mobile:', e);
    }

    // Fallback: Check memoryUsers
    if (!foundUser) {
      const memUser = memoryUsers.find(
        (u) => (u.phone || '').replace(/\D/g, '').endsWith(last10Digits)
      );
      if (memUser) {
        if (!verifyPassword(password, memUser.passwordHash)) {
          return NextResponse.json(
            { error: 'Incorrect account password for this mobile number.' },
            { status: 401 }
          );
        }
        foundUser = {
          id: memUser.id,
          full_name: memUser.name,
          applicant_email: memUser.email,
          mobile: memUser.phone || rawMobile,
          password: memUser.passwordHash,
          status: 'approved',
        };
      }
    }

    if (!foundUser) {
      return NextResponse.json(
        { error: 'No account found with this mobile number. Please check the number or register.' },
        { status: 404 }
      );
    }

    // 3. Check if newEmail is already the same
    if (foundUser.applicant_email.toLowerCase() === newEmail) {
      return NextResponse.json(
        { error: `This is already your registered email (${newEmail}). You can log in directly!` },
        { status: 400 }
      );
    }

    // 4. Check if newEmail is already used by another wholesale account
    const { data: existingOtherUser, error: emailCheckError } = await supabase
      .from('business_registrations')
      .select('id')
      .eq('applicant_email', newEmail)
      .neq('id', foundUser.id)
      .limit(1)
      .maybeSingle();

    if (!emailCheckError && existingOtherUser) {
      return NextResponse.json(
        { error: 'This new email is already in use by another account. Please use a different email address.' },
        { status: 400 }
      );
    }

    // 5. Cooldown check (prevent spamming codes to the new email)
    const cooldownStart = new Date(Date.now() - EMAIL_LOGIN_RESEND_SECONDS * 1000).toISOString();
    const { data: recentCode } = await supabase
      .from('email_login_codes')
      .select('created_at')
      .eq('email', newEmail)
      .eq('purpose', CODE_PURPOSE)
      .gte('created_at', cooldownStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentCode) {
      return NextResponse.json({
        success: true,
        message: 'A verification code was already sent to this new email recently. Please check your inbox.',
        companyName: foundUser.full_name,
        retryAfterSeconds: EMAIL_LOGIN_RESEND_SECONDS,
      });
    }

    // 6. Invalidate previous active codes for this newEmail & purpose
    await supabase
      .from('email_login_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('email', newEmail)
      .eq('purpose', CODE_PURPOSE)
      .is('consumed_at', null);

    // 7. Generate code and hash
    const code = generateEmailLoginCode();
    const codeHash = hashEmailLoginCode(newEmail, code);
    const expiresAt = new Date(Date.now() + EMAIL_LOGIN_CODE_TTL_MINUTES * 60 * 1000).toISOString();

    const { data: insertRecord, error: insertError } = await supabase
      .from('email_login_codes')
      .insert({
        email: newEmail,
        purpose: CODE_PURPOSE,
        code_hash: codeHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError || !insertRecord) {
      throw new Error(`Unable to save verification code: ${insertError?.message || 'DB error'}`);
    }

    // 8. Send verification email via Brevo
    try {
      const messageId = await sendEmailChangeCode({
        recipientEmail: newEmail,
        recipientName: foundUser.full_name || 'Business Partner',
        code,
        expiresInMinutes: EMAIL_LOGIN_CODE_TTL_MINUTES,
      });

      console.info('Brevo email-change code sent', {
        userId: foundUser.id,
        newEmail,
        messageId,
      });
    } catch (error) {
      await supabase.from('email_login_codes').delete().eq('id', insertRecord.id);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${newEmail}.`,
      companyName: foundUser.full_name,
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
      console.error('Email configuration error during email change', { error: error.message });
      return NextResponse.json(
        { error: 'Email service is not configured on the server.' },
        { status: 500 }
      );
    }
    if (error instanceof BrevoApiError) {
      console.error('Brevo email change failed', { status: error.status, error: error.message });
      return NextResponse.json(
        { error: 'Could not send verification email. Please check the new email address.' },
        { status: 502 }
      );
    }

    console.error('Forgot email request failed', { error });
    return NextResponse.json({ error: 'Unable to process email change request. Please try again.' }, { status: 500 });
  }
}
