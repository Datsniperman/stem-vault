import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/db/jwt';
import { getDbPool } from '@/lib/db/pool';
import { User, Session } from '@/lib/db/types';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ session: null, user: null });
    }

    const payload = verifyJwt<any>(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ session: null, user: null });
    }

    const pool = getDbPool();
    const result = await pool.query(
      `SELECT id, email, raw_user_meta_data, role, created_at, confirmed_at
       FROM auth.users
       WHERE id = $1
       LIMIT 1`,
      [payload.sub]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ session: null, user: null });
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      role: row.role || 'authenticated',
      user_metadata: row.raw_user_meta_data || {},
      created_at: row.created_at,
      confirmed_at: row.confirmed_at,
    };

    const session: Session = {
      access_token: token,
      token_type: 'bearer',
      user,
    };

    return NextResponse.json({ session, user });
  } catch (error: any) {
    return NextResponse.json({ session: null, user: null });
  }
}
