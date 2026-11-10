import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { deleteBlob } from '@/lib/storage';
import { isUserAdmin } from '@/lib/auth/admin';

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
        m.is_pro,
        m.zip_r2_key,
        m.zip_public_url,
        m.zip_size_bytes,
        m.zip_last_downloaded_at,
        m.zip_status,
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
        mx.is_sunday_review,
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
        zip_size_bytes: multi.zip_size_bytes ? Number(multi.zip_size_bytes) : null,
        zip_last_downloaded_at: multi.zip_last_downloaded_at,
        zip_status: multi.zip_status || 'ready',
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

export async function PATCH(
  request: NextRequest,
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

    // Verify ownership or admin
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
    const isAdmin =
      item.role === 'admin' ||
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      });

    if (item.owner_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      owner_id,
      is_pro,
      zip_r2_key,
      zip_public_url,
      zip_size_bytes,
      zip_last_downloaded_at,
      zip_status,
    } = body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description ? description.trim() : null);
    }
    if (owner_id !== undefined && isAdmin) {
      fields.push(`owner_id = $${idx++}`);
      values.push(owner_id);
    }
    if (is_pro !== undefined && isAdmin) {
      fields.push(`is_pro = $${idx++}`);
      values.push(Boolean(is_pro));
    }
    if (zip_r2_key !== undefined) {
      fields.push(`zip_r2_key = $${idx++}`);
      values.push(zip_r2_key);
    }
    if (zip_public_url !== undefined) {
      fields.push(`zip_public_url = $${idx++}`);
      values.push(zip_public_url);
    }
    if (zip_size_bytes !== undefined) {
      fields.push(`zip_size_bytes = $${idx++}`);
      values.push(zip_size_bytes ? Number(zip_size_bytes) : null);
    }
    if (zip_last_downloaded_at !== undefined) {
      fields.push(`zip_last_downloaded_at = $${idx++}`);
      values.push(zip_last_downloaded_at);
    }
    if (zip_status !== undefined) {
      fields.push(`zip_status = $${idx++}`);
      values.push(zip_status);
    }

    if (fields.length === 0) {
      return NextResponse.json({ message: 'No fields provided to update.' });
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const updateQuery = `UPDATE public.multis SET ${fields.join(', ')} WHERE id = $${idx}`;
    await pool.query(updateQuery, values);

    // Fetch refreshed multi with updated uploader details
    const refreshed = await pool.query(
      `SELECT
        m.id,
        m.owner_id,
        m.title,
        m.description,
        m.is_pro,
        m.zip_r2_key,
        m.zip_public_url,
        m.zip_size_bytes,
        m.zip_last_downloaded_at,
        m.zip_status,
        m.created_at,
        m.updated_at,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS uploader_name,
        p.avatar_url
       FROM public.multis m
       LEFT JOIN public.profiles p ON m.owner_id = p.id
       WHERE m.id = $1`,
      [id]
    );

    return NextResponse.json({ multi: refreshed.rows[0] });
  } catch (err: any) {
    console.error('[multis/update] Error:', err);
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

    // Verify ownership or admin
    const checkRes = await pool.query(
      `SELECT m.id, m.owner_id, m.zip_r2_key, p.role
       FROM public.multis m
       LEFT JOIN public.profiles p ON p.id = $1
       WHERE m.id = $2`,
      [user.id, id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found' }, { status: 404 });
    }

    const item = checkRes.rows[0];
    const isAdmin =
      item.role === 'admin' ||
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      });

    if (item.owner_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete full ZIP archive if present
    if (item.zip_r2_key) {
      await deleteBlob(item.zip_r2_key).catch(() => {});
    }

    // Delete individual track blobs from R2
    const tracksRes = await pool.query(
      `SELECT r2_key FROM public.multi_tracks WHERE multi_id = $1`,
      [id]
    );

    for (const track of tracksRes.rows) {
      if (track.r2_key) {
        await deleteBlob(track.r2_key).catch(() => {});
      }
    }

    // Delete individual mix blobs from R2
    const mixesRes = await pool.query(
      `SELECT r2_key FROM public.mixes WHERE multi_id = $1`,
      [id]
    );

    for (const mix of mixesRes.rows) {
      if (mix.r2_key) {
        await deleteBlob(mix.r2_key).catch(() => {});
      }
    }

    // Delete record from DB (cascades to tracks, mixes, etc.)
    await pool.query(`DELETE FROM public.multis WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Multi deleted successfully.' });
  } catch (err: any) {
    console.error('[multis/delete] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
