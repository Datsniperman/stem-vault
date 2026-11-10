import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { isUserAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = isUserAdmin({
      email: user.email,
      discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
      username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
      role: user.role,
      userMetadata: user.user_metadata,
    });

    if (!isAdmin && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const pool = getDbPool();
    const result = await pool.query(
      `SELECT
        id,
        email,
        display_name,
        server_display_name,
        avatar_url,
        role,
        discord_id,
        created_at
       FROM public.profiles
       ORDER BY COALESCE(server_display_name, display_name, email) ASC`
    );

    const users = result.rows.map(row => {
      const isTyler = row.discord_id === '1377286620344221778' || row.email?.toLowerCase().includes('tyler');
      const isJared = row.email?.toLowerCase().includes('jared') || row.display_name?.toLowerCase().includes('jared');
      const isPro = isTyler || isJared || row.role === 'admin';
      return {
        id: row.id,
        email: row.email,
        displayName: row.server_display_name || row.display_name || row.email || 'Member',
        avatarUrl: row.avatar_url,
        role: row.role,
        discordId: row.discord_id,
        isPro,
      };
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('[admin/users] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch users.' }, { status: 500 });
  }
}
