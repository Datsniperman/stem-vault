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

    const res = await pool.query(
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
        p.avatar_url,
        m.title AS multi_title
       FROM public.mixes mx
       LEFT JOIN public.profiles p ON mx.owner_id = p.id
       LEFT JOIN public.multis m ON mx.multi_id = m.id
       WHERE mx.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Mix not found' }, { status: 404 });
    }

    const mix = res.rows[0];
    return NextResponse.json({
      mix: {
        ...mix,
        size_bytes: Number(mix.size_bytes),
        duration_seconds: mix.duration_seconds ? Number(mix.duration_seconds) : null,
      },
    });
  } catch (err: any) {
    console.error('[mixes/detail] Error:', err);
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

    const checkRes = await pool.query(
      `SELECT mx.id, mx.owner_id, p.role
       FROM public.mixes mx
       LEFT JOIN public.profiles p ON p.id = $1
       WHERE mx.id = $2`,
      [user.id, id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Mix not found' }, { status: 404 });
    }

    const mix = checkRes.rows[0];
    const isAdmin =
      mix.role === 'admin' ||
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      });

    const isOwner = mix.owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: you cannot edit this mix.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, multi_id, owner_id, is_sunday_review } = body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title.trim());
    }

    if (multi_id !== undefined) {
      fields.push(`multi_id = $${idx++}`);
      values.push(multi_id || null);
    }

    if (owner_id !== undefined && isAdmin) {
      fields.push(`owner_id = $${idx++}`);
      values.push(owner_id);
    }

    if (is_sunday_review !== undefined && (isAdmin || isOwner)) {
      fields.push(`is_sunday_review = $${idx++}`);
      values.push(Boolean(is_sunday_review));
    }

    if (fields.length === 0) {
      return NextResponse.json({ message: 'No fields provided to update.' });
    }

    values.push(id);
    const updateQuery = `UPDATE public.mixes SET ${fields.join(', ')} WHERE id = $${idx}`;
    await pool.query(updateQuery, values);

    // Fetch refreshed mix with joins
    const refreshed = await pool.query(
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
        p.avatar_url,
        m.title AS multi_title
       FROM public.mixes mx
       LEFT JOIN public.profiles p ON mx.owner_id = p.id
       LEFT JOIN public.multis m ON mx.multi_id = m.id
       WHERE mx.id = $1`,
      [id]
    );

    return NextResponse.json({ mix: refreshed.rows[0] });
  } catch (err: any) {
    console.error('[mixes/update] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update mix.' }, { status: 500 });
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

    const checkRes = await pool.query(
      `SELECT mx.id, mx.owner_id, mx.r2_key, p.role
       FROM public.mixes mx
       LEFT JOIN public.profiles p ON p.id = $1
       WHERE mx.id = $2`,
      [user.id, id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Mix not found' }, { status: 404 });
    }

    const mix = checkRes.rows[0];
    const isAdmin =
      mix.role === 'admin' ||
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      });

    const isOwner = mix.owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: you cannot delete this mix.' }, { status: 403 });
    }

    if (mix.r2_key) {
      await deleteBlob(mix.r2_key);
    }

    await pool.query(`DELETE FROM public.mixes WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Mix deleted successfully.' });
  } catch (err: any) {
    console.error('[mixes/delete] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
