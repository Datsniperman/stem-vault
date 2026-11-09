'use server';

import { cookies } from 'next/headers';
import { getDbPool } from '@/lib/db/pool';
import { verifyJwt } from '@/lib/db/jwt';
import { isUserAdmin } from '@/lib/auth/admin';
import { getMembershipTier, canAccessTier, MembershipTier } from '@/lib/auth/tiers';
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
 * Videos requiring a higher tier than the user holds will have their playback URLs obfuscated
 * and will be marked with `isLocked: true`.
 */
export async function getRecordedSessions(): Promise<{
  sessions: RecordedSessionListItem[];
  userTier: MembershipTier;
  isAdmin: boolean;
}> {
  const user = await getSessionUser();
  const userTier = getMembershipTier(user);
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
            storage_provider, required_tier, duration_seconds, presenter, tags,
            published, view_count, created_at, updated_at
     FROM public.recorded_sessions
     ${isAdmin ? '' : 'WHERE published = true'}
     ORDER BY created_at DESC`
  );

  const sessions: RecordedSessionListItem[] = result.rows.map((row) => {
    const isLocked = !canAccessTier(userTier, row.required_tier);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail_url: row.thumbnail_url,
      storage_provider: row.storage_provider,
      required_tier: row.required_tier,
      duration_seconds: row.duration_seconds,
      presenter: row.presenter,
      tags: row.tags || [],
      published: row.published,
      view_count: row.view_count,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      isLocked,
      // Only include raw asset pointers if the user tier qualifies
      ...(isLocked ? {} : { video_asset_id: row.video_asset_id, video_url: row.video_url }),
    };
  });

  return { sessions, userTier, isAdmin };
}

/**
 * Fetch a single recorded session with access validation and short-lived stream token generation.
 */
export async function getSessionById(id: string): Promise<{
  session: RecordedSession | null;
  streamUrl: string | null;
  streamToken: string | null;
  isLocked: boolean;
  userTier: MembershipTier;
  requiredTier?: 'PLUS' | 'PREMIUM';
  error?: string;
}> {
  const user = await getSessionUser();
  const userTier = getMembershipTier(user);
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
            storage_provider, required_tier, duration_seconds, presenter, tags,
            published, view_count, created_at, updated_at
     FROM public.recorded_sessions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    return { session: null, streamUrl: null, streamToken: null, isLocked: false, userTier, error: 'Session not found' };
  }

  const row = result.rows[0];
  const requiredTier = row.required_tier as 'PLUS' | 'PREMIUM';
  const hasAccess = canAccessTier(userTier, requiredTier);

  if (!hasAccess && !isAdmin) {
    return {
      session: {
        id: row.id,
        title: row.title,
        description: row.description,
        thumbnail_url: row.thumbnail_url,
        video_asset_id: '',
        video_url: null,
        storage_provider: row.storage_provider,
        required_tier: requiredTier,
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
      userTier,
      requiredTier,
      error: `This recorded session is exclusive to ${requiredTier} tier members.`,
    };
  }

  // Increment view count asynchronously
  pool.query(`UPDATE public.recorded_sessions SET view_count = view_count + 1 WHERE id = $1`, [id]).catch(() => null);

  // Generate short-lived HMAC token for the secure stream endpoint
  const streamToken = generateStreamToken(row.id, user ? user.id : 'anon', requiredTier, 900); // 15 mins
  const streamUrl = `/api/sessions/${row.id}/stream?token=${encodeURIComponent(streamToken)}`;

  const session: RecordedSession = {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail_url: row.thumbnail_url,
    video_asset_id: row.video_asset_id,
    video_url: row.video_url,
    storage_provider: row.storage_provider,
    required_tier: requiredTier,
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
    userTier,
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
  required_tier: 'PLUS' | 'PREMIUM';
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
      storage_provider, required_tier, duration_seconds, presenter, tags, published
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      data.title.trim(),
      data.description?.trim() || null,
      data.thumbnail_url?.trim() || null,
      data.video_asset_id.trim(),
      data.video_url?.trim() || null,
      data.storage_provider || 'hls',
      data.required_tier || 'PLUS',
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
  await pool.query(`DELETE FROM public.recorded_sessions WHERE id = $1`, [id]);
  return { success: true };
}
