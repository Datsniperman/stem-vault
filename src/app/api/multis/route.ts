import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';

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
      query += ` WHERE m.title ILIKE $1 OR m.description ILIKE $1 `;
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
    const result = await pool.query(
      `INSERT INTO public.multis (owner_id, title, description, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       RETURNING *`,
      [user.id, title.trim(), description ? description.trim() : null]
    );

    return NextResponse.json({ multi: result.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('[multis/create] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create multi.' }, { status: 500 });
  }
}
