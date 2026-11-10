import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { isUserAdmin } from '@/lib/auth/admin';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pool = getDbPool();

    const res = await pool.query(
      `SELECT * FROM public.recorded_sessions WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: res.rows[0] });
  } catch (err: any) {
    console.error('[sessions/detail] Error:', err);
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
    let isDbAdmin = false;
    try {
      const pRes = await pool.query(`SELECT role FROM public.profiles WHERE id = $1`, [user.id]);
      if (pRes.rows[0]?.role === 'admin') isDbAdmin = true;
    } catch {}

    const isAdmin =
      isDbAdmin ||
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
        roles: (user as any).roles || user.user_metadata?.roles,
      });

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      thumbnail_url,
      video_asset_id,
      video_url,
      storage_provider,
      duration_seconds,
      presenter,
      tags,
      published,
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
    if (thumbnail_url !== undefined) {
      fields.push(`thumbnail_url = $${idx++}`);
      values.push(thumbnail_url ? thumbnail_url.trim() : null);
    }
    if (video_asset_id !== undefined) {
      fields.push(`video_asset_id = $${idx++}`);
      values.push(video_asset_id.trim());
    }
    if (video_url !== undefined) {
      fields.push(`video_url = $${idx++}`);
      values.push(video_url ? video_url.trim() : null);
    }
    if (storage_provider !== undefined) {
      fields.push(`storage_provider = $${idx++}`);
      values.push(storage_provider);
    }
    if (duration_seconds !== undefined) {
      fields.push(`duration_seconds = $${idx++}`);
      values.push(duration_seconds || null);
    }
    if (presenter !== undefined) {
      fields.push(`presenter = $${idx++}`);
      values.push(presenter ? presenter.trim() : null);
    }
    if (tags !== undefined) {
      fields.push(`tags = $${idx++}`);
      values.push(tags);
    }
    if (published !== undefined) {
      fields.push(`published = $${idx++}`);
      values.push(Boolean(published));
    }

    if (fields.length === 0) {
      return NextResponse.json({ message: 'No fields provided to update.' });
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE public.recorded_sessions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json({ session: result.rows[0] });
  } catch (err: any) {
    console.error('[sessions/update] Error:', err);
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

    const isAdmin =
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      });

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const pool = getDbPool();
    await pool.query(`DELETE FROM public.recorded_sessions WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Session deleted successfully.' });
  } catch (err: any) {
    console.error('[sessions/delete] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
