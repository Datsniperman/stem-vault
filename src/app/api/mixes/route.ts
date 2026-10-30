import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';

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
