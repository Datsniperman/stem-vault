import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbPool } from '@/lib/db/pool';
import { createUserToken } from '@/lib/db/jwt';
import { User, Session } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const result = await pool.query(
      `SELECT id, email, encrypted_password, raw_user_meta_data, role, created_at, confirmed_at
       FROM auth.users
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 400 }
      );
    }

    const row = result.rows[0];
    const passwordMatch = bcrypt.compareSync(password, row.encrypted_password || '');

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 400 }
      );
    }

    const user: User = {
      id: row.id,
      email: row.email,
      role: row.role || 'authenticated',
      user_metadata: row.raw_user_meta_data || {},
      created_at: row.created_at,
      confirmed_at: row.confirmed_at,
    };

    const token = createUserToken(user);

    const session: Session = {
      access_token: token,
      token_type: 'bearer',
      expires_in: 7 * 24 * 60 * 60,
      user,
    };

    const response = NextResponse.json({ session, user });

    // Set session cookies
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
    console.error('[auth/login] Error:', error.message);
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
