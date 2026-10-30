'use server';

import { revalidatePath } from 'next/cache';
import { FormState, Stem, Profile } from '@/types';
import { createDbServerClient, createDbAdminClient } from '@/lib/db/server';
import { sendReportEmail, sendBugReportEmail } from '@/lib/email';
import { announceMultitrack, postMixToThread } from '@/lib/discord';

const ADMIN_EMAIL = 'connorwbrown07@gmail.com';
const MAX_SUBMISSIONS_PER_DAY = 5;

// ── Validation helpers ───────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeText(value: string, maxLen = 1000): string {
  return value.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').slice(0, 40))
    .filter(Boolean)
    .slice(0, 8); // max 8 tags
}

function isUniqueConstraintError(error: { message?: string; code?: string }): boolean {
  return (
    error.code === '23505' ||
    (error.message || '').toLowerCase().includes('unique') ||
    (error.message || '').toLowerCase().includes('duplicate')
  );
}

// ── Server Actions ───────────────────────────────────────────────────────────

export async function submitStem(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const errors: Record<string, string> = {};

  const title          = sanitizeText(formData.get('title') as string || '', 200);
  const artist         = sanitizeText(formData.get('artist') as string || '', 200);
  const downloadUrl    = (formData.get('download_url') as string || '').trim();
  const dawTemplateUrl = (formData.get('daw_template_url') as string || '').trim();
  const hostPlatform   = sanitizeText(formData.get('host_platform') as string || 'Google Drive', 50);
  const format         = sanitizeText(formData.get('format') as string || 'WAV (48kHz/24-bit)', 50);
  const uploaderHandle = sanitizeText(formData.get('uploader_handle') as string || 'Anonymous', 50);
  const keyVal         = sanitizeText(formData.get('key') as string || '', 10);
  const description    = sanitizeText(formData.get('description') as string || '', 1000);
  const tagsRaw        = (formData.get('tags') as string || '');
  const tags           = parseTags(tagsRaw);

  const bpmRaw        = parseInt(formData.get('bpm') as string || '');
  const trackCountRaw = parseInt(formData.get('track_count') as string || '');

  if (!title) errors.title = 'Song title is required.';
  if (!artist) errors.artist = 'Artist name is required.';
  if (!downloadUrl) {
    errors.download_url = 'Download link is required.';
  } else if (!isValidUrl(downloadUrl)) {
    errors.download_url = 'Must be a valid https:// URL.';
  }
  if (dawTemplateUrl && !isValidUrl(dawTemplateUrl)) {
    errors.daw_template_url = 'DAW template must be a valid https:// URL.';
  }

  const bpm        = isNaN(bpmRaw) ? null : bpmRaw;
  const trackCount = isNaN(trackCountRaw) ? null : trackCountRaw;

  if (bpm !== null && (bpm < 30 || bpm > 300))           errors.bpm = 'BPM must be between 30 and 300.';
  if (trackCount !== null && (trackCount < 1 || trackCount > 128)) errors.track_count = 'Track count must be between 1 and 128.';

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the errors below.', errors };
  }

  try {
    const db = await createDbServerClient();
    if (!db) {
      return { success: false, message: 'Database connection failed.' };
    }

    const { data: { user } } = await db.auth.getUser();

    // ── Rate limiting: max 5 submissions per 24 hours ────────────────────────
    if (user) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await db
        .from('stems')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', since);

      if ((count ?? 0) >= MAX_SUBMISSIONS_PER_DAY) {
        return {
          success: false,
          message: `You've reached the limit of ${MAX_SUBMISSIONS_PER_DAY} submissions per 24 hours. Please try again later.`,
        };
      }
    }

    let resolvedHandle = uploaderHandle || 'Anonymous';
    if (user) {
      const { data: profile } = await db
        .from('profiles')
        .select('display_name, server_display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.server_display_name || profile?.display_name) {
        resolvedHandle = profile.server_display_name || profile.display_name;
      }
    }

    // Insert directly as published — no approval barrier!
    const { data, error } = await db
      .from('stems')
      .insert([{
        user_id: user?.id ?? null,
        title,
        artist,
        bpm,
        key: keyVal || null,
        track_count: trackCount,
        format,
        host_platform: hostPlatform,
        download_url: downloadUrl,
        daw_template_url: dawTemplateUrl || null,
        uploader_handle: resolvedHandle,
        description: description || null,
        tags,
        status: 'published',
      }])
      .select()
      .single();

    if (error) {
      console.error('[submitStem] Database error:', error);
      return { success: false, message: `Submission failed: ${error.message}` };
    }

    const stem = data as Stem;

    // Immediately announce to Discord & start mix feedback thread
    try {
      const { messageId, threadId } = await announceMultitrack({
        stemId: stem.id,
        title: stem.title,
        artist: stem.artist,
        bpm: stem.bpm,
        key: stem.key,
        trackCount: stem.track_count,
        downloadUrl: stem.download_url,
        dawTemplateUrl: stem.daw_template_url,
        uploaderHandle: stem.uploader_handle,
      });

      if (messageId || threadId) {
        await db
          .from('stems')
          .update({ discord_message_id: messageId, discord_thread_id: threadId })
          .eq('id', stem.id);
        stem.discord_message_id = messageId;
        stem.discord_thread_id = threadId;
      }
    } catch (discErr) {
      console.error('[submitStem] Discord announcement error:', discErr);
    }

    revalidatePath('/');
    revalidatePath('/showcase');
    return {
      success: true,
      message: '✓ Published! Your multitrack pack is live in The Mixing Vault and announced on Discord.',
      stem,
    };
  } catch (err) {
    console.error('[submitStem] Unexpected error:', err);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
}

export async function updateStem(
  stemId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; stem?: Stem; errors?: Record<string, string> }> {
  const errors: Record<string, string> = {};

  const title        = sanitizeText(formData.get('title') as string || '', 200);
  const artist       = sanitizeText(formData.get('artist') as string || '', 200);
  const downloadUrl    = (formData.get('download_url') as string || '').trim();
  const dawTemplateUrl = (formData.get('daw_template_url') as string || '').trim();
  const hostPlatform = sanitizeText(formData.get('host_platform') as string || 'Google Drive', 50);
  const format       = sanitizeText(formData.get('format') as string || 'WAV (48kHz/24-bit)', 50);
  const keyVal       = sanitizeText(formData.get('key') as string || '', 10);
  const description  = sanitizeText(formData.get('description') as string || '', 1000);
  const tagsRaw      = (formData.get('tags') as string || '');
  const tags         = parseTags(tagsRaw);

  const bpmRaw        = parseInt(formData.get('bpm') as string || '');
  const trackCountRaw = parseInt(formData.get('track_count') as string || '');

  if (!title) errors.title = 'Song title is required.';
  if (!artist) errors.artist = 'Artist name is required.';
  if (!downloadUrl) {
    errors.download_url = 'Download link is required.';
  } else if (!isValidUrl(downloadUrl)) {
    errors.download_url = 'Must be a valid https:// URL.';
  }

  const bpm        = isNaN(bpmRaw) ? null : bpmRaw;
  const trackCount = isNaN(trackCountRaw) ? null : trackCountRaw;

  if (bpm !== null && (bpm < 30 || bpm > 300))           errors.bpm = 'BPM must be between 30 and 300.';
  if (trackCount !== null && (trackCount < 1 || trackCount > 128)) errors.track_count = 'Track count must be between 1 and 128.';

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the errors below.', errors };
  }

  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    // Fetch existing stem to check ownership & current profile role
    const { data: existingStem, error: fetchErr } = await db
      .from('stems')
      .select('*')
      .eq('id', stemId)
      .single();

    if (fetchErr || !existingStem) {
      return { success: false, message: 'Stem not found.' };
    }

    let isAllowed = false;
    let isAdmin = false;

    if (dbServer) {
      const { data: { user } } = await dbServer.auth.getUser();
      if (user) {
        if (user.id === existingStem.user_id) {
          isAllowed = true;
        }
        const { data: profile } = await dbServer
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') {
          isAllowed = true;
          isAdmin = true;
        }
      }
    }

    // Fallback: if dbAdmin was created, allow admin update
    if (!isAllowed && dbAdmin) {
      isAllowed = true;
      isAdmin = true;
    }

    if (!isAllowed) {
      return { success: false, message: 'Unauthorized. You can only edit your own submissions unless you are an admin.' };
    }

    // Perform update
    const { data: updatedStem, error: updateErr } = await db
      .from('stems')
      .update({
        title,
        artist,
        bpm,
        key: keyVal || null,
        track_count: trackCount,
        format,
        host_platform: hostPlatform,
        download_url: downloadUrl,
        daw_template_url: dawTemplateUrl || null,
        description: description || null,
        tags,
      })
      .eq('id', stemId)
      .select()
      .single();

    if (updateErr) {
      console.error('[updateStem] Update error:', updateErr);
      return { success: false, message: `Update failed: ${updateErr.message}` };
    }

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/stems/${stemId}`);
    revalidatePath('/showcase');

    return {
      success: true,
      message: '✓ Stem session updated successfully!',
      stem: updatedStem as Stem,
    };
  } catch (err: any) {
    console.error('[updateStem] Unexpected error:', err);
    return { success: false, message: 'An unexpected error occurred while updating.' };
  }
}

export async function deleteStem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    const { data, error } = await db
      .from('stems')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[deleteStem] Database delete error:', error);
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'Delete failed: Stem was already deleted or not found.'
      };
    }

    revalidatePath('/');
    revalidatePath('/profile');
    return { success: true, message: 'Stem deleted successfully.' };
  } catch (err) {
    console.error('[deleteStem] Unexpected error:', err);
    return { success: false, message: 'Delete failed.' };
  }
}

export async function toggleStemVerification(
  id: string,
  isVerified: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    const { data, error } = await db
      .from('stems')
      .update({ is_verified: isVerified })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[toggleStemVerification] Error:', error.message);
      return { success: false, message: `Update failed: ${error.message}` };
    }

    revalidatePath('/');
    revalidatePath(`/stems/${id}`);
    return { success: true, message: `Stem verification status updated.` };
  } catch (err: any) {
    console.error('[toggleStemVerification] Error:', err);
    return { success: false, message: 'Failed to update stem verification status.' };
  }
}

export async function flagStem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    const { data: stemData } = await db.from('stems').select('title, artist, download_url').eq('id', id).single();

    const { error } = await db.from('stems').update({ status: 'flagged' }).eq('id', id);
    if (error) return { success: false, message: error.message };

    // Send real email notification via Resend
    if (stemData) {
      await sendReportEmail({
        title: stemData.title,
        artist: stemData.artist,
        downloadUrl: stemData.download_url,
        stemId: id,
      });
    }

    revalidatePath('/');
    return {
      success: true,
      message: `Link reported. Email notification sent to ${ADMIN_EMAIL}.`
    };
  } catch {
    return { success: false, message: 'Report failed.' };
  }
}

// ── Admin Moderation Actions ─────────────────────────────────────────────────

export async function approveStem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    const { data: stem, error: stemErr } = await db
      .from('stems')
      .select('*')
      .eq('id', id)
      .single();

    if (stemErr || !stem) {
      return { success: false, message: 'Stem not found.' };
    }

    const { error } = await db
      .from('stems')
      .update({ status: 'published' })
      .eq('id', id);

    if (error) return { success: false, message: error.message };

    // Discord Multitrack Announcement & Thread Creation
    try {
      const { messageId, threadId } = await announceMultitrack({
        stemId: stem.id,
        title: stem.title,
        artist: stem.artist,
        bpm: stem.bpm,
        key: stem.key,
        trackCount: stem.track_count,
        downloadUrl: stem.download_url,
        uploaderHandle: stem.uploader_handle,
      });

      if (messageId || threadId) {
        await db
          .from('stems')
          .update({ discord_message_id: messageId, discord_thread_id: threadId })
          .eq('id', stem.id);
      }
    } catch (discordErr) {
      console.error('[approveStem] Discord announcement error:', discordErr);
    }

    revalidatePath('/');
    revalidatePath(`/stems/${id}`);
    revalidatePath('/showcase');
    return { success: true, message: 'Stem approved and published to vault & Discord!' };
  } catch {
    return { success: false, message: 'Approval failed.' };
  }
}

export async function rejectStem(id: string): Promise<{ success: boolean; message: string }> {
  return deleteStem(id);
}

export async function restoreStem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    const { error } = await db
      .from('stems')
      .update({ status: 'published' })
      .eq('id', id);

    if (error) return { success: false, message: error.message };

    revalidatePath('/');
    return { success: true, message: 'Stem restored to published.' };
  } catch {
    return { success: false, message: 'Restore failed.' };
  }
}

export async function getPendingStems(): Promise<Stem[]> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return [];

    const { data } = await db
      .from('stems')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return (data as Stem[]) || [];
  } catch {
    return [];
  }
}

export async function getFlaggedStems(): Promise<Stem[]> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return [];

    const { data } = await db
      .from('stems')
      .select('*')
      .eq('status', 'flagged')
      .order('created_at', { ascending: false });

    return (data as Stem[]) || [];
  } catch {
    return [];
  }
}

export async function getAllStems(): Promise<Stem[]> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return [];

    const { data } = await db
      .from('stems')
      .select('*')
      .order('created_at', { ascending: false });

    return (data as Stem[]) || [];
  } catch {
    return [];
  }
}

export async function getUserStems(userId: string): Promise<Stem[]> {
  try {
    const db = await createDbServerClient();
    if (!db) return [];

    const { data } = await db
      .from('stems')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data as Stem[]) || [];
  } catch {
    return [];
  }
}

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;
    if (!db) return null;

    const cleanHandle = decodeURIComponent(handle).trim().replace(/^@/, '');

    // 1. Try display_name match (case-insensitive)
    const { data: profile } = await db
      .from('profiles')
      .select('*')
      .ilike('display_name', cleanHandle)
      .maybeSingle();

    if (profile) return profile as Profile;

    // 2. Try email prefix match if no display_name matches
    const { data: profileByEmail } = await db
      .from('profiles')
      .select('*')
      .ilike('email', `${cleanHandle}@%`)
      .maybeSingle();

    return (profileByEmail as Profile) || null;
  } catch {
    return null;
  }
}

export async function getPublicUserStemsByHandle(handle: string): Promise<Stem[]> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;
    if (!db) return [];

    const cleanHandle = decodeURIComponent(handle).trim().replace(/^@/, '');

    // First try fetching by profile id if profile exists
    const profile = await getProfileByHandle(cleanHandle);

    if (profile) {
      const { data } = await db
        .from('stems')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) return data as Stem[];
    }

    // Fallback search by uploader_handle directly (case-insensitive)
    const { data: stemsByHandle } = await db
      .from('stems')
      .select('*')
      .ilike('uploader_handle', cleanHandle)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (stemsByHandle && stemsByHandle.length > 0) return stemsByHandle as Stem[];

    // Additional fallback: handles with or without '@' prefix
    const altHandle = cleanHandle.startsWith('@') ? cleanHandle.slice(1) : `@${cleanHandle}`;
    const { data: stemsAlt } = await db
      .from('stems')
      .select('*')
      .ilike('uploader_handle', altHandle)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    return (stemsAlt as Stem[]) || [];
  } catch {
    return [];
  }
}


// ── Download Tracking ────────────────────────────────────────────────────────

export async function incrementDownloadCount(id: string): Promise<void> {
  try {
    const db = await createDbServerClient();
    if (!db) return;

    // Try RPC first (if you've created one in Database)
    const { error: rpcError } = await db.rpc('increment_download_count', { stem_id: id });

    if (rpcError) {
      // Fallback: manual read-increment-write
      const { data: stem } = await db
        .from('stems')
        .select('download_count')
        .eq('id', id)
        .single();
      if (stem) {
        await db
          .from('stems')
          .update({ download_count: (stem.download_count || 0) + 1 })
          .eq('id', id);
      }
    }
  } catch {
    // Non-critical — swallow errors
  }
}

// ── Profile / User Actions ───────────────────────────────────────────────────

export async function updateUsername(userId: string, displayName: string): Promise<{ success: boolean; message: string }> {
  try {
    const db = await createDbServerClient();
    if (!db) return { success: false, message: 'Database connection failed.' };

    const cleanName = displayName.trim().replace(/^@/, '');
    if (!cleanName) return { success: false, message: 'Username cannot be empty.' };

    const { error } = await db
      .from('profiles')
      .update({ display_name: cleanName })
      .eq('id', userId);

    if (error) {
      if (isUniqueConstraintError(error)) {
        return { success: false, message: `@${cleanName} is already taken. Please choose a different username.` };
      }
      return { success: false, message: error.message };
    }

    revalidatePath('/');
    return { success: true, message: `Username updated to @${cleanName}.` };
  } catch (err) {
    console.error('[updateUsername] Error:', err);
    return { success: false, message: 'Failed to update username.' };
  }
}

export async function updateUserRole(
  userId: string,
  role: 'user' | 'verified' | 'admin'
): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    const { data, error } = await db
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select();

    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) {
      return { success: false, message: 'Role update failed: User profile not found.' };
    }

    revalidatePath('/');
    return { success: true, message: `Role updated to ${role === 'verified' ? 'Super User / Pro' : role}.` };
  } catch {
    return { success: false, message: 'Role update failed.' };
  }
}

export async function setUserRoleByEmail(
  email: string,
  role: 'user' | 'verified' | 'admin'
): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return { success: false, message: 'Database connection failed.' };

    const cleanEmail = email.trim().toLowerCase();

    // 1. Update existing profile using case-insensitive email match
    const { error, data } = await db
      .from('profiles')
      .update({ role })
      .ilike('email', cleanEmail)
      .select();

    if (error) {
      return { success: false, message: `Update error: ${error.message}` };
    }

    if (data && data.length > 0) {
      revalidatePath('/');
      return { success: true, message: `User ${cleanEmail} updated to ${role === 'verified' ? 'Super User / Pro' : role}.` };
    }

    // 2. Fallback check for partial email match
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id, email')
      .filter('email', 'ilike', `%${cleanEmail}%`)
      .maybeSingle();

    if (existingProfile) {
      const { data: updatedData, error: updateErr } = await db
        .from('profiles')
        .update({ role })
        .eq('id', existingProfile.id)
        .select();

      if (!updateErr && updatedData && updatedData.length > 0) {
        revalidatePath('/');
        return { success: true, message: `User ${cleanEmail} updated to ${role === 'verified' ? 'Super User / Pro' : role}.` };
      }
    }

    return {
      success: false,
      message: `No user profile found for "${cleanEmail}". Make sure the user has created an account.`
    };
  } catch (err) {
    console.error('[setUserRoleByEmail] Error:', err);
    return { success: false, message: 'Role update failed.' };
  }
}

export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (!db) return [];

    const { data } = await db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return (data as Profile[]) || [];
  } catch {
    return [];
  }
}

// ── Rating, Comments & Community Mixes Actions ──────────────────────────────────

// Helper to reliably authenticate user via server cookies OR fallback access token
async function getAuthenticatedUser(dbServer: any, accessToken?: string) {
  try {
    if (dbServer) {
      const { data: { user } } = await dbServer.auth.getUser();
      if (user) return user;
    }
  } catch {
    // Cookie auth fallback
  }

  if (accessToken) {
    try {
      const dbAdmin = await createDbAdminClient();
      const db = dbAdmin || dbServer;
      if (db) {
        const { data: { user }, error } = await db.auth.getUser(accessToken);
        if (!error && user) return user;
      }
    } catch (err) {
      console.error('[getAuthenticatedUser] Access token auth error:', err);
    }
  }

  return null;
}

// Helper to ensure user profile exists in db prior to foreign key operations
async function ensureUserProfile(db: any, user: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<string> {
  try {
    const { data: profile } = await db
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      if (profile.display_name) return `@${profile.display_name}`;
      if (profile.email) return `@${profile.email.split('@')[0]}`;
    }

    const fallbackHandle = user.user_metadata?.display_name || (user.email ? user.email.split('@')[0] : 'Anonymous');
    await db
      .from('profiles')
      .upsert({ id: user.id, email: user.email || null, display_name: fallbackHandle, role: 'user' }, { onConflict: 'id' });

    return `@${fallbackHandle}`;
  } catch (err) {
    console.error('[ensureUserProfile] Warning:', err);
    return `@${user.email ? user.email.split('@')[0] : 'Anonymous'}`;
  }
}

export async function rateStem(
  stemId: string,
  rating: number,
  accessToken?: string
): Promise<{ success: boolean; message: string; avgRating?: number; userRating?: number }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const user = await getAuthenticatedUser(dbServer, accessToken);

    if (!user) return { success: false, message: 'You must be logged in to rate.' };
    if (rating < 1 || rating > 5) return { success: false, message: 'Rating must be between 1 and 5.' };

    const db = dbAdmin || dbServer;
    if (!db) return { success: false, message: 'Database connection failed.' };

    await ensureUserProfile(db, user);

    const { error } = await db
      .from('stem_ratings')
      .upsert({ stem_id: stemId, user_id: user.id, rating }, { onConflict: 'stem_id,user_id' });

    if (error) {
      console.error('[rateStem] Error:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/');
    revalidatePath(`/stems/${stemId}`);
    return { success: true, message: 'Rating saved.', userRating: rating };
  } catch (err) {
    console.error('[rateStem] Unexpected error:', err);
    return { success: false, message: 'Failed to save rating.' };
  }
}

export async function addComment(
  stemId: string,
  content: string,
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const user = await getAuthenticatedUser(dbServer, accessToken);

    if (!user) return { success: false, message: 'You must be signed in to post comments.' };

    const cleanContent = content.trim().slice(0, 2000);
    if (!cleanContent) return { success: false, message: 'Comment cannot be empty.' };

    const db = dbAdmin || dbServer;
    if (!db) return { success: false, message: 'Database connection failed.' };

    const handle = await ensureUserProfile(db, user);

    const { error } = await db
      .from('stem_comments')
      .insert([{ stem_id: stemId, user_id: user.id, user_handle: handle, content: cleanContent }]);

    if (error) return { success: false, message: error.message };

    revalidatePath(`/stems/${stemId}`);
    return { success: true, message: 'Comment posted.' };
  } catch (err) {
    console.error('[addComment] Error:', err);
    return { success: false, message: 'Failed to post comment.' };
  }
}

export async function deleteComment(
  commentId: string,
  stemId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await createDbServerClient();
    if (!db) return { success: false, message: 'Database connection failed.' };

    const { data: { user } } = await db.auth.getUser();
    if (!user) return { success: false, message: 'You must be signed in.' };

    const { error } = await db
      .from('stem_comments')
      .delete()
      .eq('id', commentId);

    if (error) return { success: false, message: error.message };

    revalidatePath(`/stems/${stemId}`);
    return { success: true, message: 'Comment deleted.' };
  } catch (err) {
    console.error('[deleteComment] Error:', err);
    return { success: false, message: 'Failed to delete comment.' };
  }
}

export interface SubmitMixPayload {
  stemId: string;
  songName: string;
  key: string;
  bpm: number;
  mixUrl: string;
  notes?: string;
  accessToken?: string;
}

export async function submitMix(payload: SubmitMixPayload): Promise<{
  success: boolean;
  message: string;
  mixId?: string;
  discordPostId?: string | null;
  discordThreadUrl?: string | null;
  discordThreadId?: string | null;
}> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const user = await getAuthenticatedUser(dbServer, payload.accessToken);

    if (!user) {
      return { success: false, message: 'You must be logged in with your Discord account to submit a mix.' };
    }

    const songName = sanitizeText(payload.songName || '', 200);
    const key = sanitizeText(payload.key || '', 20);
    const bpm = Number(payload.bpm);
    const mixUrl = (payload.mixUrl || '').trim();
    const notes = sanitizeText(payload.notes || '', 1000);

    if (!songName) return { success: false, message: 'Song name is required.' };
    if (!key) return { success: false, message: 'Musical key is required.' };
    if (!bpm || isNaN(bpm) || bpm <= 0) return { success: false, message: 'A valid positive BPM is required.' };
    if (!mixUrl || !isValidUrl(mixUrl)) {
      return { success: false, message: 'Please provide a valid cloud audio URL (Google Drive, Dropbox, Box, etc.).' };
    }

    const db = dbAdmin || dbServer;
    if (!db) return { success: false, message: 'Database connection failed.' };

    // Query user profile for server_display_name and discord_id
    const { data: profile } = await db
      .from('profiles')
      .select('display_name, server_display_name, discord_id')
      .eq('id', user.id)
      .maybeSingle();

    const submitterHandle = profile?.server_display_name || profile?.display_name || 'Member';

    // Insert into public.stem_mixes
    const { data: newMix, error: insertErr } = await db
      .from('stem_mixes')
      .insert({
        stem_id: payload.stemId,
        user_id: user.id,
        user_handle: submitterHandle,
        song_name: songName,
        musical_key: key,
        bpm: bpm,
        mix_url: mixUrl,
        description: notes || null,
        title: `${songName} (${key} @ ${bpm} BPM)`,
        likes_count: 0,
      })
      .select()
      .single();

    if (insertErr || !newMix) {
      return { success: false, message: insertErr?.message || 'Failed to record mix in db.' };
    }

    // Lookup parent stem for Discord thread ID
    const { data: stem } = await db
      .from('stems')
      .select('title, artist, discord_thread_id')
      .eq('id', payload.stemId)
      .single();

    let discordPostId: string | null = null;
    let discordThreadUrl: string | null = null;

    if (stem?.discord_thread_id) {
      try {
        discordPostId = await postMixToThread(stem.discord_thread_id, {
          songName,
          artist: stem.artist,
          key,
          bpm,
          mixUrl,
          notes: notes || undefined,
          submitterHandle,
          discordId: profile?.discord_id || undefined,
        });

        if (discordPostId) {
          await db
            .from('stem_mixes')
            .update({ discord_post_id: discordPostId })
            .eq('id', newMix.id);
        }

        const guildId = process.env.DISCORD_GUILD_ID;
        if (guildId && stem.discord_thread_id) {
          discordThreadUrl = `https://discord.com/channels/${guildId}/${stem.discord_thread_id}`;
        }
      } catch (postErr) {
        console.error('[submitMix] Discord thread post error:', postErr);
      }
    }

    revalidatePath(`/stems/${payload.stemId}`);
    revalidatePath('/showcase');

    return {
      success: true,
      message: 'Mix submitted successfully!',
      mixId: newMix.id,
      discordPostId,
      discordThreadUrl,
      discordThreadId: stem?.discord_thread_id || null,
    };
  } catch (err: any) {
    console.error('[submitMix] Error:', err);
    return { success: false, message: err.message || 'Failed to submit mix.' };
  }
}

export async function submitCommunityMix(
  stemId: string,
  title: string,
  mixUrl: string,
  description?: string,
  accessToken?: string
): Promise<{ success: boolean; message: string; discordThreadUrl?: string | null }> {
  return submitMix({
    stemId,
    songName: title,
    key: 'Standard',
    bpm: 120,
    mixUrl,
    notes: description,
    accessToken,
  });
}

export async function toggleMixLike(
  mixId: string,
  stemId: string,
  accessToken?: string
): Promise<{ success: boolean; message: string; liked?: boolean }> {
  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const user = await getAuthenticatedUser(dbServer, accessToken);

    if (!user) return { success: false, message: 'You must be signed in to like a mix.' };

    const db = dbAdmin || dbServer;
    if (!db) return { success: false, message: 'Database connection failed.' };

    await ensureUserProfile(db, user);

    // Check if already liked
    const { data: existingLike } = await db
      .from('mix_likes')
      .select('id')
      .eq('mix_id', mixId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Remove like
      await db.from('mix_likes').delete().eq('id', existingLike.id);
      const { data: currentMix } = await db.from('stem_mixes').select('likes_count').eq('id', mixId).single();
      if (currentMix) {
        await db.from('stem_mixes').update({ likes_count: Math.max(0, (currentMix.likes_count || 1) - 1) }).eq('id', mixId);
      }
      revalidatePath(`/stems/${stemId}`);
      revalidatePath('/showcase');
      return { success: true, message: 'Unliked mix.', liked: false };
    } else {
      // Add like
      await db.from('mix_likes').insert([{ mix_id: mixId, user_id: user.id }]);
      const { data: currentMix } = await db.from('stem_mixes').select('likes_count').eq('id', mixId).single();
      if (currentMix) {
        await db.from('stem_mixes').update({ likes_count: (currentMix.likes_count || 0) + 1 }).eq('id', mixId);
      }
      revalidatePath(`/stems/${stemId}`);
      revalidatePath('/showcase');
      return { success: true, message: 'Liked mix!', liked: true };
    }
  } catch (err) {
    console.error('[toggleMixLike] Error:', err);
    return { success: false, message: 'Failed to update like status.' };
  }
}

export async function submitBugReport(
  contactInfo: string,
  description: string,
  userHandle?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanContact = contactInfo.trim().slice(0, 200);
    const cleanDesc = description.trim().slice(0, 3000);

    if (!cleanContact) return { success: false, message: 'Please provide contact info (Email or Discord handle).' };
    if (!cleanDesc) return { success: false, message: 'Please describe the bug or issue.' };

    const result = await sendBugReportEmail({
      contactInfo: cleanContact,
      description: cleanDesc,
      userHandle,
    });

    if (!result.success) {
      return { success: false, message: result.error || 'Failed to submit bug report email.' };
    }

    return { success: true, message: 'Bug report sent! Thanks for helping improve Stem Vault.' };
  } catch (err: any) {
    console.error('[submitBugReport] Error:', err);
    return { success: false, message: 'Failed to submit bug report.' };
  }
}


