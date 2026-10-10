import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { hashPassword, createSessionToken, memoryUsers, AuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a valid full name.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? String(phone).trim() : '';

    const supabase = getServiceSupabase();

    // 1. Check if user already exists in Supabase
    try {
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!checkError && existing) {
        return NextResponse.json(
          {
            code: 'ACCOUNT_EXISTS',
            error: 'An account with this email already exists. Please log in.',
          },
          { status: 409 }
        );
      }
    } catch {
      // If table doesn't exist yet, check memory
    }

    // Check memory fallback
    if (memoryUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        {
          code: 'ACCOUNT_EXISTS',
          error: 'An account with this email already exists. Please log in.',
        },
        { status: 409 }
      );
    }

    const hashedPassword = hashPassword(password);
    let newUser: AuthUser | null = null;

    // 2. Insert into Supabase
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          phone: cleanPhone,
        })
        .select('id, name, email, phone, created_at')
        .single();

      if (!insertError && inserted) {
        newUser = {
          id: inserted.id,
          name: inserted.name,
          email: inserted.email,
          phone: inserted.phone,
          createdAt: inserted.created_at,
        };
      }
    } catch {
      // Supabase table not created yet, proceed to memory
    }

    // 3. Fallback to memory if DB insert didn't happen
    if (!newUser) {
      const fallbackUser = {
        id: `usr-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      memoryUsers.push(fallbackUser);
      newUser = {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        phone: fallbackUser.phone,
        createdAt: fallbackUser.createdAt,
      };
    }

    // 4. Generate session token
    const token = createSessionToken(newUser);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully!',
        user: newUser,
        token,
      },
      { status: 201 }
    );

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during registration. Please try again.' },
      { status: 500 }
    );
  }
}
