import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { isUserAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: multiId } = await params;
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to add tracks.' }, { status: 401 });
    }

    const pool = getDbPool();
    const multiRes = await pool.query(`SELECT owner_id FROM public.multis WHERE id = $1`, [multiId]);
    if (multiRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found.' }, { status: 404 });
    }

    const multi = multiRes.rows[0];
    const isAdmin = isUserAdmin({
      email: user.email,
      discordId: user.user_metadata?.provider_id,
      role: user.role,
    });

    if (multi.owner_id !== user.id && !isAdmin && user.role !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission to modify this multi.' }, { status: 403 });
    }

    const body = await request.json();
    const { stored_filename, original_filename, format, size_bytes, r2_key, public_url, duration_seconds } = body;

    if (!stored_filename || !r2_key || !public_url) {
      return NextResponse.json({ error: 'Track filenames and storage URLs are required.' }, { status: 400 });
    }

    const trackRes = await pool.query(
      `INSERT INTO public.multi_tracks (multi_id, stored_filename, original_filename, format, size_bytes, r2_key, public_url, duration_seconds, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       RETURNING *`,
      [
        multiId,
        stored_filename,
        original_filename || stored_filename,
        (format || 'WAV').toUpperCase(),
        size_bytes || 0,
        r2_key,
        public_url,
        duration_seconds || null,
      ]
    );

    return NextResponse.json({ track: trackRes.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('[multis/add-track] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to add track.' }, { status: 500 });
  }
}
