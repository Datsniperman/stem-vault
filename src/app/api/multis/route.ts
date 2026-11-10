import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { isUserAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const proOnly = searchParams.get('pro') === 'true';

    const pool = getDbPool();
    let query = `
      SELECT
        m.id,
        m.owner_id,
        m.title,
        m.description,
        m.is_pro,
        m.created_at,
        m.updated_at,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS uploader_name,
        p.avatar_url,
        COUNT(mt.id)::int AS track_count,
        COALESCE(SUM(mt.size_bytes), 0)::bigint AS total_size_bytes
      FROM public.multis m
      LEFT JOIN public.profiles p ON m.owner_id = p.id
      LEFT JOIN public.multi_tracks mt ON m.id = mt.multi_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`m.title ILIKE $${params.length}`);
    }
    if (proOnly) {
      conditions.push(`m.is_pro = true`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')} `;
    }

    query += `
      GROUP BY m.id, m.is_pro, p.server_display_name, p.display_name, p.email, p.avatar_url
      ORDER BY m.created_at DESC
    `;

    const res = await pool.query(query, params);

    return NextResponse.json({
      multis: res.rows.map(row => ({
        ...row,
        total_size_bytes: Number(row.total_size_bytes),
      })),
    });
  } catch (err: any) {
    console.error('[multis/list] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create a multi.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, is_pro } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Multi title is required.' }, { status: 400 });
    }

    const pool = getDbPool();

    // Check admin status for is_pro flag
    const isAdmin = isUserAdmin({
      email: user.email,
      discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
      username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
      role: user.role,
      userMetadata: user.user_metadata,
    });

    const isProMulti = isAdmin && Boolean(is_pro);

    // Auto-upsert profile for this user if missing so left joins always show the uploader's name
    let displayName =
      user.user_metadata?.server_display_name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Member';

    try {
      const pRes = await pool.query(
        `SELECT server_display_name, display_name FROM public.profiles WHERE id = $1`,
        [user.id]
      );
      if (pRes.rows.length > 0) {
        displayName = pRes.rows[0].server_display_name || pRes.rows[0].display_name || displayName;
      }
    } catch {}

    const avatarUrl = user.user_metadata?.avatar_url || null;
    const discordId = user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id) || null;

    await pool.query(
      `INSERT INTO public.profiles (id, email, display_name, server_display_name, avatar_url, discord_id, role)
       VALUES ($1, $2, $3, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         server_display_name = COALESCE(public.profiles.server_display_name, EXCLUDED.server_display_name),
         display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
         avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url)`,
      [
        user.id,
        user.email || null,
        displayName,
        avatarUrl,
        discordId,
        isAdmin ? 'admin' : (user.role === 'admin' ? 'admin' : 'user'),
      ]
    ).catch(e => console.warn('Could not auto-upsert profile in multis POST:', e.message));

    const result = await pool.query(
      `INSERT INTO public.multis (owner_id, title, description, is_pro, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING *`,
      [user.id, title.trim(), description ? description.trim() : null, isProMulti]
    );

    const createdMulti = result.rows[0];

    return NextResponse.json({ multi: createdMulti }, { status: 201 });
  } catch (err: any) {
    console.error('[multis/create] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create multi.' }, { status: 500 });
  }
}
