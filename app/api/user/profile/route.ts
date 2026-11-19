import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/requestAuth';
import { createSessionToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PUT /api/user/profile  — update name, phone (and optionally email) for logged-in user
export async function PUT(request: NextRequest) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Please sign in to update your profile.' },
      { status: 401 }
    );
  }

  let body: { name?: string; phone?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, phone, email } = body;

  if (!name && !phone && !email) {
    return NextResponse.json(
      { success: false, error: 'Provide at least one field to update.' },
      { status: 400 }
    );
  }

  const cleanName = name?.trim();
  const cleanPhone = phone?.trim();
  const cleanEmail = email?.trim().toLowerCase();

  if (cleanName !== undefined && cleanName.length < 2) {
    return NextResponse.json(
      { success: false, error: 'Name must be at least 2 characters.' },
      { status: 400 }
    );
  }
  if (cleanEmail !== undefined && !cleanEmail.includes('@')) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Build the patch object — only include fields that were actually supplied
  const patch: Record<string, string> = {};
  if (cleanName !== undefined) patch.full_name = cleanName;
  if (cleanPhone !== undefined) patch.mobile = cleanPhone;
  if (cleanEmail !== undefined) patch.applicant_email = cleanEmail;

  // 1. Update in business_registrations (the primary users table)
  let dbUpdated = false;
  try {
    const { error: updateError } = await supabase
      .from('business_registrations')
      .update(patch)
      .eq('id', authUser.id);

    if (!updateError) {
      dbUpdated = true;
    } else {
      console.error('[PUT /api/user/profile] DB update error:', updateError.message);
    }
  } catch (err) {
    console.error('[PUT /api/user/profile] Unexpected DB error:', err);
  }

  // 2. Build updated user object and issue a fresh session token so
  //    the JWT reflects the new name/phone immediately
  const updatedUser = {
    ...authUser,
    name: cleanName ?? authUser.name,
    phone: cleanPhone ?? authUser.phone,
    email: cleanEmail ?? authUser.email,
  };

  const newToken = createSessionToken(updatedUser);

  const response = NextResponse.json({
    success: true,
    dbUpdated,
    user: updatedUser,
    token: newToken,
    message: dbUpdated
      ? 'Profile updated successfully in the database.'
      : 'Profile updated locally. Database sync pending.',
  });

  // Refresh the session cookie as well
  response.cookies.set('ar_session', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
