import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyJwt } from '@/lib/db/jwt';
import { getDbPool } from '@/lib/db/pool';
import { User } from '@/lib/db/types';

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token =
        request.cookies.get('mv_session_token')?.value ||
        request.cookies.get('sb-access-token')?.value ||
        '';
    }

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyJwt<any>(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const pool = getDbPool();

    if (body.password) {
      const hashedPassword = bcrypt.hashSync(body.password, 10);
      await pool.query(
        `UPDATE auth.users SET encrypted_password = $1, updated_at = now() WHERE id = $2`,
        [hashedPassword, payload.sub]
      );
    }

    if (body.data) {
      await pool.query(
        `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || $1::jsonb, updated_at = now() WHERE id = $2`,
        [JSON.stringify(body.data), payload.sub]
      );
    }

    const result = await pool.query(
      `SELECT id, email, raw_user_meta_data, role, created_at, confirmed_at
       FROM auth.users
       WHERE id = $1`,
      [payload.sub]
    );

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      role: row.role || 'authenticated',
      user_metadata: row.raw_user_meta_data || {},
      created_at: row.created_at,
      confirmed_at: row.confirmed_at,
    };

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Update failed' },
      { status: 500 }
    );
  }
}
