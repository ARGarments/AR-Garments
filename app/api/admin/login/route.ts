import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken } from '@/lib/adminSession';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@argarment.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123';
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (
      email.trim().toLowerCase() !== ADMIN_EMAIL?.trim().toLowerCase() ||
      password !== ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = createAdminToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set('ar_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('ar_admin_session');
  return response;
}
