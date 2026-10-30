import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDbPool } from '@/lib/db/pool';
import { createUserToken } from '@/lib/db/jwt';
import { User, Session } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { message: 'Valid email and password (minimum 8 characters) required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const existing = await pool.query(
      `SELECT id FROM auth.users WHERE lower(email) = lower($1) LIMIT 1`,
      [email.trim()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { message: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const cleanName = (displayName || email.split('@')[0]).trim();
    const userMeta = { display_name: cleanName, full_name: cleanName };

    await pool.query(
      `INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
      ) VALUES (
        $1, '00000000-0000-0000-0000-000000000000', $2, $3, $4,
        '{"provider":"email","providers":["email"]}', $5, 'authenticated', 'authenticated', $4, $4
      )`,
      [userId, email.trim().toLowerCase(), hashedPassword, now, JSON.stringify(userMeta)]
    );

    // Ensure public.profiles has the record
    await pool.query(
      `INSERT INTO public.profiles (id, email, display_name, server_display_name, role)
       VALUES ($1, $2, $3, $3, 'user')
       ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name`,
      [userId, email.trim().toLowerCase(), cleanName]
    );

    const user: User = {
      id: userId,
      email: email.trim().toLowerCase(),
      role: 'authenticated',
      user_metadata: userMeta,
      created_at: now,
      confirmed_at: now,
    };

    const token = createUserToken(user);
    const session: Session = {
      access_token: token,
      token_type: 'bearer',
      expires_in: 7 * 24 * 60 * 60,
      user,
    };

    const response = NextResponse.json({ session, user });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    response.cookies.set('mv_session_token', token, cookieOptions);
    response.cookies.set('sb-access-token', token, cookieOptions);

    return response;
  } catch (error: any) {
    console.error('[auth/signup] Error:', error.message);
    return NextResponse.json(
      { message: error?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
