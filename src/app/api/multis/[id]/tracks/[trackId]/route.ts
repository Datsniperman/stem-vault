import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { deleteBlob } from '@/lib/storage';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const { id, trackId } = await context.params;
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();

    // Verify ownership of the multi or admin role
    const checkRes = await pool.query(
      `SELECT mt.id, mt.r2_key, m.owner_id, p.role
       FROM public.multi_tracks mt
       JOIN public.multis m ON mt.multi_id = m.id
       LEFT JOIN public.profiles p ON p.id = $1
       WHERE mt.id = $2 AND m.id = $3`,
      [user.id, trackId, id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const track = checkRes.rows[0];
    const isOwner = track.owner_id === user.id;
    const isAdmin = track.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: you cannot delete this track.' }, { status: 403 });
    }

    // Delete from storage
    if (track.r2_key) {
      await deleteBlob(track.r2_key);
    }

    // Delete from DB
    await pool.query(`DELETE FROM public.multi_tracks WHERE id = $1`, [trackId]);

    return NextResponse.json({ success: true, message: 'Track deleted successfully.' });
  } catch (err: any) {
    console.error('[tracks/delete] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
