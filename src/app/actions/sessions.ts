'use server';

import { cookies } from 'next/headers';
import { getDbPool } from '@/lib/db/pool';
import { verifyJwt } from '@/lib/db/jwt';
import { isUserAdmin } from '@/lib/auth/admin';
import { hasMemberAccess } from '@/lib/auth/tiers';
import { generateStreamToken } from '@/lib/video/tokens';
import { RecordedSession, RecordedSessionListItem } from '@/types/sessions';

async function getSessionUser() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('mv_session_token')?.value ||
    cookieStore.get('sb-access-token')?.value ||
    '';

  if (!token) return null;
  const payload = verifyJwt<any>(token);
  if (!payload || !payload.sub) return null;

  return {
    id: payload.sub,
    email: payload.email || '',
    role: payload.role || 'authenticated',
    user_metadata: payload.user_metadata || {},
    roles: payload.user_metadata?.roles || payload.roles || [],
  };
}

/**
 * Fetch all published recorded sessions.
 * Any user with active membership has access to all recorded sessions.
 */
export async function getRecordedSessions(): Promise<{
  sessions: RecordedSessionListItem[];
  isMember: boolean;
  isAdmin: boolean;
}> {
  const user = await getSessionUser();
  const isMember = hasMemberAccess(user);
  const isAdmin = user
    ? isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || user.id,
        username: user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      })
    : false;

  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, title, description, thumbnail_url, video_asset_id, video_url,
            storage_provider, duration_seconds, presenter, tags,
            published, view_count, created_at, updated_at
     FROM public.recorded_sessions
     ${isAdmin ? '' : 'WHERE published = true'}
     ORDER BY created_at DESC`
  );

  const sessions: RecordedSessionListItem[] = result.rows.map((row) => {
    const isLocked = !isMember && !isAdmin;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail_url: row.thumbnail_url,
      storage_provider: row.storage_provider,
      duration_seconds: row.duration_seconds,
      presenter: row.presenter,
      tags: row.tags || [],
      published: row.published,
      view_count: row.view_count,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      isLocked,
      ...(isLocked ? {} : { video_asset_id: row.video_asset_id, video_url: row.video_url }),
    };
  });

  return { sessions, isMember, isAdmin };
}

/**
 * Fetch a single recorded session with access validation and short-lived stream token generation.
 */
export async function getSessionById(id: string): Promise<{
  session: RecordedSession | null;
  streamUrl: string | null;
  streamToken: string | null;
  isLocked: boolean;
  isMember: boolean;
  error?: string;
}> {
  const user = await getSessionUser();
  const isMember = hasMemberAccess(user);
  const isAdmin = user
    ? isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || user.id,
        username: user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      })
    : false;

  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, title, description, thumbnail_url, video_asset_id, video_url,
            storage_provider, duration_seconds, presenter, tags,
            published, view_count, created_at, updated_at
     FROM public.recorded_sessions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    return { session: null, streamUrl: null, streamToken: null, isLocked: false, isMember, error: 'Session not found' };
  }

  const row = result.rows[0];
  const hasAccess = isMember || isAdmin;

  if (!hasAccess) {
    return {
      session: {
        id: row.id,
        title: row.title,
        description: row.description,
        thumbnail_url: row.thumbnail_url,
        video_asset_id: '',
        video_url: null,
        storage_provider: row.storage_provider,
        duration_seconds: row.duration_seconds,
        presenter: row.presenter,
        tags: row.tags || [],
        published: row.published,
        view_count: row.view_count,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : '',
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : '',
      },
      streamUrl: null,
      streamToken: null,
      isLocked: true,
      isMember: false,
      error: 'This recorded session is exclusive to All Access members.',
    };
  }

  pool.query(`UPDATE public.recorded_sessions SET view_count = view_count + 1 WHERE id = $1`, [id]).catch(() => null);

  const streamToken = generateStreamToken(row.id, user ? user.id : 'anon', 900);
  const streamUrl = `/api/sessions/${row.id}/stream?token=${encodeURIComponent(streamToken)}`;

  const session: RecordedSession = {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail_url: row.thumbnail_url,
    video_asset_id: row.video_asset_id,
    video_url: row.video_url,
    storage_provider: row.storage_provider,
    duration_seconds: row.duration_seconds,
    presenter: row.presenter,
    tags: row.tags || [],
    published: row.published,
    view_count: row.view_count + 1,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : '',
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : '',
  };

  return {
    session,
    streamUrl,
    streamToken,
    isLocked: false,
    isMember: true,
  };
}

/**
 * Admin action: create a new recorded session.
 */
export async function createRecordedSession(data: {
  title: string;
  description?: string;
  thumbnail_url?: string;
  video_asset_id: string;
  video_url?: string;
  storage_provider?: 'hls' | 'cloudflare_stream' | 'mux' | 'r2';
  duration_seconds?: number;
  presenter?: string;
  tags?: string[];
  published?: boolean;
}): Promise<{ success: boolean; session?: RecordedSession; error?: string }> {
  const user = await getSessionUser();
  const isAdmin = user
    ? isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || user.id,
        username: user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      })
    : false;

  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  if (!data.title?.trim() || !data.video_asset_id?.trim()) {
    return { success: false, error: 'Title and Video Asset ID are required.' };
  }

  const pool = getDbPool();
  const result = await pool.query(
    `INSERT INTO public.recorded_sessions (
      title, description, thumbnail_url, video_asset_id, video_url,
      storage_provider, duration_seconds, presenter, tags, published
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      data.title.trim(),
      data.description?.trim() || null,
      data.thumbnail_url?.trim() || null,
      data.video_asset_id.trim(),
      data.video_url?.trim() || null,
      data.storage_provider || 'hls',
      data.duration_seconds || null,
      data.presenter?.trim() || null,
      data.tags || [],
      data.published ?? true,
    ]
  );

  return { success: true, session: result.rows[0] };
}

/**
 * Admin action: delete a recorded session.
 */
export async function deleteRecordedSession(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
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
      discordId: user.user_metadata?.provider_id || user.id,
      username: user.user_metadata?.display_name,
      role: user.role,
      userMetadata: user.user_metadata,
      roles: user.roles,
    });

  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  await pool.query(`DELETE FROM public.recorded_sessions WHERE id = $1`, [id]);
  return { success: true };
}

/**
 * Admin action: update a recorded session.
 */
export async function updateRecordedSession(
  id: string,
  data: {
    title?: string;
    description?: string;
    thumbnail_url?: string;
    video_asset_id?: string;
    video_url?: string;
    storage_provider?: 'hls' | 'cloudflare_stream' | 'mux' | 'r2';
    duration_seconds?: number;
    presenter?: string;
    tags?: string[];
    published?: boolean;
  }
): Promise<{ success: boolean; session?: RecordedSession; error?: string }> {
  const user = await getSessionUser();
  const isAdmin = user
    ? isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || user.id,
        username: user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      })
    : false;

  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  const pool = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(data.title.trim());
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(data.description ? data.description.trim() : null);
  }
  if (data.thumbnail_url !== undefined) {
    fields.push(`thumbnail_url = $${idx++}`);
    values.push(data.thumbnail_url ? data.thumbnail_url.trim() : null);
  }
  if (data.video_asset_id !== undefined) {
    fields.push(`video_asset_id = $${idx++}`);
    values.push(data.video_asset_id.trim());
  }
  if (data.video_url !== undefined) {
    fields.push(`video_url = $${idx++}`);
    values.push(data.video_url ? data.video_url.trim() : null);
  }
  if (data.storage_provider !== undefined) {
    fields.push(`storage_provider = $${idx++}`);
    values.push(data.storage_provider);
  }
  if (data.duration_seconds !== undefined) {
    fields.push(`duration_seconds = $${idx++}`);
    values.push(data.duration_seconds || null);
  }
  if (data.presenter !== undefined) {
    fields.push(`presenter = $${idx++}`);
    values.push(data.presenter ? data.presenter.trim() : null);
  }
  if (data.tags !== undefined) {
    fields.push(`tags = $${idx++}`);
    values.push(data.tags);
  }
  if (data.published !== undefined) {
    fields.push(`published = $${idx++}`);
    values.push(data.published);
  }

  if (fields.length === 0) {
    return { success: true };
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE public.recorded_sessions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return { success: true, session: result.rows[0] };
}
