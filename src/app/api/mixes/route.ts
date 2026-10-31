import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { announceMix } from '@/lib/discord';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const multiId = searchParams.get('multi_id');
    const search = searchParams.get('q') || '';

    const pool = getDbPool();
    let query = `
      SELECT
        mx.id,
        mx.owner_id,
        mx.multi_id,
        mx.title,
        mx.format,
        mx.size_bytes,
        mx.r2_key,
        mx.public_url,
        mx.duration_seconds,
        mx.created_at,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS uploader_name,
        p.avatar_url,
        m.title AS multi_title
      FROM public.mixes mx
      LEFT JOIN public.profiles p ON mx.owner_id = p.id
      LEFT JOIN public.multis m ON mx.multi_id = m.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (multiId) {
      params.push(multiId);
      conditions.push(`mx.multi_id = $${params.length}`);
    }

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(mx.title ILIKE $${params.length} OR m.title ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')} `;
    }

    query += ` ORDER BY mx.created_at DESC `;

    const res = await pool.query(query, params);

    return NextResponse.json({
      mixes: res.rows.map(row => ({
        ...row,
        size_bytes: Number(row.size_bytes),
        duration_seconds: row.duration_seconds ? Number(row.duration_seconds) : null,
      })),
    });
  } catch (err: any) {
    console.error('[mixes/list] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create a mix.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, multi_id, r2_key, public_url, format, size_bytes, duration_seconds } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Mix title is required.' }, { status: 400 });
    }
    if (!r2_key || !public_url) {
      return NextResponse.json({ error: 'Storage references (r2_key, public_url) are required.' }, { status: 400 });
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
    ).catch(e => console.warn('Could not auto-upsert profile in mixes POST:', e.message));

    const result = await pool.query(
      `INSERT INTO public.mixes (owner_id, multi_id, title, format, size_bytes, r2_key, public_url, duration_seconds, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       RETURNING *`,
      [
        user.id,
        multi_id || null,
        title.trim(),
        (format || 'WAV').toUpperCase(),
        size_bytes || 0,
        r2_key,
        public_url,
        duration_seconds || null,
      ]
    );

    const createdMix = result.rows[0];

    // Announce to Discord
    try {
      let multiTitle: string | null = null;
      let threadId: string | null = null;

      if (multi_id) {
        const multiRes = await pool.query(
          `SELECT title, discord_thread_id FROM public.multis WHERE id = $1`,
          [multi_id]
        );
        if (multiRes.rows.length > 0) {
          multiTitle = multiRes.rows[0].title;
          threadId = multiRes.rows[0].discord_thread_id;
        }
      }

      const discordPostId = await announceMix({
        mixId: createdMix.id,
        title: createdMix.title,
        format: createdMix.format,
        publicUrl: createdMix.public_url,
        uploaderName: displayName,
        discordId,
        multiTitle,
        threadId,
      });

      if (discordPostId) {
        await pool.query(
          `UPDATE public.mixes SET discord_post_id = $1 WHERE id = $2`,
          [discordPostId, createdMix.id]
        ).catch(() => {});
      }
    } catch (discErr) {
      console.error('[mixes/create] Discord announcement error:', discErr);
    }

    return NextResponse.json({ mix: createdMix }, { status: 201 });
  } catch (err: any) {
    console.error('[mixes/create] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save mix record.' }, { status: 500 });
  }
}
