import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { deleteBlob } from '@/lib/storage';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pool = getDbPool();

    // 1. Fetch Multi and Owner
    const multiRes = await pool.query(
      `SELECT
        m.id,
        m.owner_id,
        m.title,
        m.description,
        m.created_at,
        m.updated_at,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS uploader_name,
        p.avatar_url
       FROM public.multis m
       LEFT JOIN public.profiles p ON m.owner_id = p.id
       WHERE m.id = $1`,
      [id]
    );

    if (multiRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found' }, { status: 404 });
    }

    const multi = multiRes.rows[0];

    // 2. Fetch Tracks
    const tracksRes = await pool.query(
      `SELECT
        id,
        multi_id,
        stored_filename,
        original_filename,
        format,
        size_bytes,
        r2_key,
        public_url,
        duration_seconds,
        created_at
       FROM public.multi_tracks
       WHERE multi_id = $1
       ORDER BY stored_filename ASC`,
      [id]
    );

    // 3. Fetch Mixes linked to this Multi
    const mixesRes = await pool.query(
      `SELECT
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
        p.avatar_url
       FROM public.mixes mx
       LEFT JOIN public.profiles p ON mx.owner_id = p.id
       WHERE mx.multi_id = $1
       ORDER BY mx.created_at DESC`,
      [id]
    );

    const totalSizeBytes = tracksRes.rows.reduce((sum, t) => sum + Number(t.size_bytes), 0);

    return NextResponse.json({
      multi: {
        ...multi,
        track_count: tracksRes.rows.length,
        total_size_bytes: totalSizeBytes,
        tracks: tracksRes.rows.map(t => ({
          ...t,
          size_bytes: Number(t.size_bytes),
          duration_seconds: t.duration_seconds ? Number(t.duration_seconds) : null,
          uploader_name: multi.uploader_name,
        })),
        mixes: mixesRes.rows.map(m => ({
          ...m,
          size_bytes: Number(m.size_bytes),
          duration_seconds: m.duration_seconds ? Number(m.duration_seconds) : null,
        })),
      },
    });
  } catch (err: any) {
    console.error('[multis/detail] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    // Check multi ownership or admin
    const checkRes = await pool.query(
      `SELECT m.id, m.owner_id, p.role
       FROM public.multis m
       LEFT JOIN public.profiles p ON p.id = $1
       WHERE m.id = $2`,
      [user.id, id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found' }, { status: 404 });
    }

    const item = checkRes.rows[0];
    const isOwner = item.owner_id === user.id;
    const isAdmin = item.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: you cannot delete this multi.' }, { status: 403 });
    }

    // Get all track r2_keys to delete from storage
    const tracksRes = await pool.query(
      `SELECT r2_key FROM public.multi_tracks WHERE multi_id = $1`,
      [id]
    );

    // Delete tracks from storage
    for (const row of tracksRes.rows) {
      if (row.r2_key) {
        await deleteBlob(row.r2_key);
      }
    }

    // Delete multi from DB (cascade deletes multi_tracks)
    await pool.query(`DELETE FROM public.multis WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Multi deleted successfully.' });
  } catch (err: any) {
    console.error('[multis/delete] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
