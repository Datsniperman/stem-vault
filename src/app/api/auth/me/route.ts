import { isUserAdmin } from '@/lib/auth/admin';
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

    const isAdmin = isUserAdmin({
      email: payload.email,
      discordId: payload.user_metadata?.provider_id,
      username: payload.user_metadata?.display_name,
      role: payload.role,
      userMetadata: payload.user_metadata,
    });

    const calculatedRole = isAdmin ? 'admin' : (payload.role || 'authenticated');

    // Verified user directly from the signed JWT payload
    let user: User = {
      id: payload.sub,
      email: payload.email || '',
      role: calculatedRole,
      user_metadata: {
        ...(payload.user_metadata || {}),
        role: isAdmin ? 'admin' : (payload.user_metadata?.role || 'user'),
      },
    };

    // Optionally enrich with database row if Postgres is reachable
    try {
      const pool = getDbPool();
      const result = await pool.query(
        `SELECT id, email, raw_user_meta_data, role, created_at, confirmed_at
         FROM auth.users
         WHERE id = $1
         LIMIT 1`,
        [payload.sub]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        user = {
          id: row.id,
          email: row.email,
          role: row.role || user.role,
          user_metadata: row.raw_user_meta_data || user.user_metadata,
          created_at: row.created_at,
          confirmed_at: row.confirmed_at,
        };
      }
    } catch {
      // Local database query skipped or unreachable - JWT is cryptographically verified
    }

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
