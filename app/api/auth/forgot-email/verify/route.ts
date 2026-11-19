import { NextRequest, NextResponse } from 'next/server';
import {
  EMAIL_LOGIN_MAX_ATTEMPTS,
  InvalidEmailError,
  normalizeEmail,
  verifyEmailLoginCode,
} from '@/lib/emailLogin';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyPassword, memoryUsers } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_PURPOSE = 'email-change';
const INVALID_CODE_RESPONSE = { error: 'The verification code is invalid or has expired. / कोड अमान्य या समाप्त हो गया है।' };

interface StoredCodeRow {
  id: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawMobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const newEmail = normalizeEmail(body.newEmail);
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(INVALID_CODE_RESPONSE, { status: 400 });
    }

    const cleanMobile = rawMobile.replace(/\D/g, '');
    const last10Digits = cleanMobile.slice(-10);

    const supabase = getServiceSupabase();

    // 1. Re-verify user ownership via mobile and password
    let foundUserId: string | null = null;
    let oldEmail: string | null = null;

    try {
      const { data: users, error: lookupError } = await supabase
        .from('business_registrations')
        .select('id, full_name, applicant_email, mobile, password')
        .ilike('mobile', `%${last10Digits}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!lookupError && Array.isArray(users)) {
        for (const u of users) {
          if (u.password && verifyPassword(password, u.password)) {
            foundUserId = u.id;
            oldEmail = u.applicant_email;
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Error verifying user during email change confirm:', e);
    }

    if (!foundUserId) {
      const memUser = memoryUsers.find(
        (u) => (u.phone || '').replace(/\D/g, '').endsWith(last10Digits)
      );
      if (memUser && verifyPassword(password, memUser.passwordHash)) {
        foundUserId = memUser.id;
        oldEmail = memUser.email;
      }
    }

    if (!foundUserId) {
      return NextResponse.json(
        { error: 'Account verification failed. Please check your mobile number and password.' },
        { status: 401 }
      );
    }

    // 2. Fetch the latest unconsumed code for the new email
    const { data, error: codeError } = await supabase
      .from('email_login_codes')
      .select('id, code_hash, attempts, expires_at')
      .eq('email', newEmail)
      .eq('purpose', CODE_PURPOSE)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      throw new Error(`Unable to verify code: ${codeError.message}`);
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

    // 3. Track attempt count
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

    // 4. Verify code hash
    if (!claimedAttempt || !verifyEmailLoginCode(newEmail, code, storedCode.code_hash)) {
      return NextResponse.json(INVALID_CODE_RESPONSE, { status: 401 });
    }

    // 5. Mark code as consumed
    await supabase
      .from('email_login_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', storedCode.id);

    // 6. Safe Update: Update applicant_email in business_registrations
    const { error: updateError } = await supabase
      .from('business_registrations')
      .update({ applicant_email: newEmail })
      .eq('id', foundUserId);

    if (updateError) {
      console.error('Failed to update email in business_registrations:', updateError.message);
      throw new Error(`Database error while updating email: ${updateError.message}`);
    }

    // 7. Safe Cascade: Update user_email in orders table so past & pending orders stay linked
    try {
      const { error: ordersUpdateError } = await supabase
        .from('orders')
        .update({ user_email: newEmail })
        .eq('user_id', foundUserId);

      if (ordersUpdateError) {
        console.warn('Could not cascade update user_email in orders:', ordersUpdateError.message);
      }
    } catch (e) {
      console.warn('Cascade update in orders table skipped:', e);
    }

    // 8. Update in-memory user if present
    const memUser = memoryUsers.find((u) => u.id === foundUserId || u.email.toLowerCase() === (oldEmail || '').toLowerCase());
    if (memUser) {
      memUser.email = newEmail;
    }

    return NextResponse.json({
      success: true,
      message: `Your login email has been updated to ${newEmail}. All your company details and orders remain safe!`,
      newEmail,
    });
  } catch (error) {
    if (error instanceof InvalidEmailError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Email change confirmation failed:', error);
    return NextResponse.json({ error: 'Unable to update email address. Please try again.' }, { status: 500 });
  }
}
