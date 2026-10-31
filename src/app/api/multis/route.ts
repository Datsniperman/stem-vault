import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { announceMultitrack } from '@/lib/discord';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    const pool = getDbPool();
    let query = `
      SELECT
        m.id,
        m.owner_id,
        m.title,
        m.description,
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

    const params: any[] = [];
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` WHERE m.title ILIKE $1 `;
    }

    query += `
      GROUP BY m.id, p.server_display_name, p.display_name, p.email, p.avatar_url
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
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Multi title is required.' }, { status: 400 });
    }

    const pool = getDbPool();

    // Auto-upsert profile for this user if missing so left joins always show the uploader's name
    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Member';
    const avatarUrl = user.user_metadata?.avatar_url || null;
    const discordId = user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id) || null;

    await pool.query(
      `INSERT INTO public.profiles (id, email, display_name, server_display_name, avatar_url, discord_id, role)
       VALUES ($1, $2, $3, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
         avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url)`,
      [
        user.id,
        user.email || null,
        displayName,
        avatarUrl,
        discordId,
        user.role === 'admin' ? 'admin' : 'user',
      ]
    ).catch(e => console.warn('Could not auto-upsert profile in multis POST:', e.message));

    const result = await pool.query(
      `INSERT INTO public.multis (owner_id, title, description, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       RETURNING *`,
      [user.id, title.trim(), description ? description.trim() : null]
    );

    const createdMulti = result.rows[0];

    // Announce new multitrack to Discord & create mix feedback thread
    try {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mixingvault.com').replace(/\/+$/, '');
      const disc = await announceMultitrack({
        stemId: createdMulti.id,
        title: createdMulti.title,
        artist: 'Community Worship',
        bpm: null,
        key: null,
        trackCount: null,
        downloadUrl: `${siteUrl}/multis/${createdMulti.id}`,
        uploaderHandle: displayName,
      });

      if (disc.messageId || disc.threadId) {
        await pool.query(
          `UPDATE public.multis SET discord_message_id = $1, discord_thread_id = $2 WHERE id = $3`,
          [disc.messageId, disc.threadId, createdMulti.id]
        ).catch(() => {});
      }
    } catch (discErr) {
      console.error('[multis/create] Discord announcement error:', discErr);
    }

    return NextResponse.json({ multi: createdMulti }, { status: 201 });
  } catch (err: any) {
    console.error('[multis/create] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create multi.' }, { status: 500 });
  }
}
