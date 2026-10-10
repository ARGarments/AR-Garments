import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyPassword, createSessionToken, memoryUsers, AuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = getServiceSupabase();

    let foundUser: AuthUser | null = null;
    let storedPasswordHash: string | null = null;

    // 1. Check Supabase
    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('id, name, email, password, phone, created_at')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && dbUser) {
        foundUser = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          createdAt: dbUser.created_at,
        };
        storedPasswordHash = dbUser.password;
      }
    } catch {
      // Table doesn't exist yet, check memory
    }

    // 2. Check memory fallback if not in DB
    if (!foundUser) {
      const memUser = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (memUser) {
        foundUser = {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          phone: memUser.phone,
          createdAt: memUser.createdAt,
        };
        storedPasswordHash = memUser.passwordHash;
      }
    }

    // If user not found
    if (!foundUser || !storedPasswordHash) {
      return NextResponse.json(
        {
          code: 'ACCOUNT_NOT_FOUND',
          error: 'No account exists with this email. Please register first.',
        },
        { status: 404 }
      );
    }

    // 3. Verify password
    const isPasswordValid = verifyPassword(password, storedPasswordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    // 4. Generate session token
    const token = createSessionToken(foundUser);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: foundUser,
      token,
    });

    // Set cookie
    response.cookies.set('ar_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during login. Please try again.' },
      { status: 500 }
    );
  }
}
