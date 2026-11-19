import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, memoryUsers } from '@/lib/auth';
import {
  EMAIL_LOGIN_MAX_ATTEMPTS,
  InvalidEmailError,
  normalizeEmail,
  verifyEmailLoginCode,
} from '@/lib/emailLogin';
import { getServiceSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_PURPOSE = 'password-reset';
const INVALID_CODE_RESPONSE = { error: 'The password reset code is invalid or has expired. / कोड अमान्य या समाप्त हो गया है।' };

interface StoredCodeRow {
  id: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(INVALID_CODE_RESPONSE, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long. / नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Fetch latest unconsumed reset code
    const { data, error: codeError } = await supabase
      .from('email_login_codes')
      .select('id, code_hash, attempts, expires_at')
      .eq('email', email)
      .eq('purpose', CODE_PURPOSE)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      throw new Error(`Unable to verify reset code: ${codeError.message}`);
    }
    if (!data) {
      return NextResponse.json(INVALID_CODE_RESPONSE, { status: 401 });
    }

    const storedCode = data as StoredCodeRow;

    if (
      new Date(storedCode.expires_at).getTime() <= Date.now() ||
      storedCode.attempts >= EMAIL_LOGIN_MAX_ATTEMPTS
    ) {
      return NextResponse.json(INVALID_CODE_RESPONSE, { status: 401 });
    }

    // 2. Track attempt count
    const { data: claimedAttempt, error: attemptError } = await supabase
      .from('email_login_codes')
      .update({ attempts: storedCode.attempts + 1 })
      .eq('id', storedCode.id)
      .eq('attempts', storedCode.attempts)
      .is('consumed_at', null)
      .select('id')
      .maybeSingle();

    if (attemptError) {
      throw new Error(`Unable to record verification attempt: ${attemptError.message}`);
    }

    // 3. Verify code hash
    if (!claimedAttempt || !verifyEmailLoginCode(email, code, storedCode.code_hash)) {
      return NextResponse.json(INVALID_CODE_RESPONSE, { status: 401 });
    }

    // 4. Mark code as consumed
    await supabase
      .from('email_login_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', storedCode.id);

    // 5. Hash new password and update database
    const hashedPassword = hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('business_registrations')
      .update({ password: hashedPassword })
      .eq('applicant_email', email);

    if (updateError) {
      console.error('Failed to update password in business_registrations:', updateError.message);
      throw new Error(`Database error while updating password: ${updateError.message}`);
    }

    // Also update in-memory fallback if user exists there
    const memUser = memoryUsers.find((u) => u.email.toLowerCase() === email);
    if (memUser) {
      memUser.passwordHash = hashedPassword;
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully! Please log in with your new password. / पासवर्ड सफलतापूर्वक बदल दिया गया है!',
    });
  } catch (error) {
    if (error instanceof InvalidEmailError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Password reset verification failed:', error);
    return NextResponse.json({ error: 'Unable to reset password. Please try again.' }, { status: 500 });
  }
}
