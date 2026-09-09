'use server';

import { revalidatePath } from 'next/cache';
import { FormState, Stem, Profile } from '@/types';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendReportEmail } from '@/lib/email';

const ADMIN_EMAIL = 'connorwbrown07@gmail.com';

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

// ── Server Actions ───────────────────────────────────────────────────────────

export async function submitStem(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const errors: Record<string, string> = {};

  const title          = sanitizeText(formData.get('title') as string || '', 200);
  const artist         = sanitizeText(formData.get('artist') as string || '', 200);
  const downloadUrl    = (formData.get('download_url') as string || '').trim();
  const hostPlatform   = sanitizeText(formData.get('host_platform') as string || 'Google Drive', 50);
  const format         = sanitizeText(formData.get('format') as string || 'WAV (48kHz/24-bit)', 50);
  const uploaderHandle = sanitizeText(formData.get('uploader_handle') as string || 'Anonymous', 50);
  const keyVal         = sanitizeText(formData.get('key') as string || '', 10);
  const description    = sanitizeText(formData.get('description') as string || '', 1000);

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
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { success: false, message: 'Database connection failed.' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
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
        uploader_handle: uploaderHandle || 'Anonymous',
        description: description || null,
        status: 'published',
      }])
      .select()
      .single();

    if (error) {
      console.error('[submitStem] Supabase error:', error);
      return { success: false, message: `Submission failed: ${error.message}` };
    }

    revalidatePath('/');
    return { success: true, message: 'Stems submitted to the archive.', stem: data as Stem };
  } catch (err) {
    console.error('[submitStem] Unexpected error:', err);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteStem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const { data, error } = await supabase
      .from('stems')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[deleteStem] Supabase delete error:', error);
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'Delete failed: Database permission (RLS) blocked this action or the stem was already deleted.'
      };
    }

    revalidatePath('/');
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
    const supabaseServer = await createSupabaseServerClient();
    const supabaseAdmin = await createSupabaseAdminClient();
    const supabase = supabaseAdmin || supabaseServer;

    if (!supabase) return { success: false, message: 'Database connection failed.' };

    // Verify current user is admin before toggling
    if (supabaseServer) {
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabaseServer
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userProfile && userProfile.role !== 'admin') {
          return { success: false, message: 'Only admins can toggle Pro Session status.' };
        }
      }
    }

    const { data, error } = await supabase
      .from('stems')
      .update({ is_verified: isVerified })
      .eq('id', id)
      .select();

    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) {
      return { success: false, message: 'Update failed: Row-Level Security policy blocked update in database.' };
    }

    revalidatePath('/');
    return { success: true, message: `Stem marked as ${isVerified ? 'verified' : 'unverified'}.` };
  } catch {
    return { success: false, message: 'Verification update failed.' };
  }
}

export async function flagStem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const { data: stemData } = await supabase.from('stems').select('title, artist, download_url').eq('id', id).single();

    const { error } = await supabase.from('stems').update({ status: 'flagged' }).eq('id', id);
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

export async function updateUsername(userId: string, displayName: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const cleanName = displayName.trim().replace(/^@/, '');
    if (!cleanName) return { success: false, message: 'Username cannot be empty.' };

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: cleanName })
      .eq('id', userId);

    if (error) return { success: false, message: error.message };

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
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select();

    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) {
      return { success: false, message: 'Role update failed: Database RLS policy blocked the update.' };
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
    const supabaseServer = await createSupabaseServerClient();
    const supabaseAdmin = await createSupabaseAdminClient();
    const supabase = supabaseAdmin || supabaseServer;

    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const cleanEmail = email.trim().toLowerCase();

    // 1. Update existing profile using case-insensitive email match
    const { error, data } = await supabase
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

    // 2. If profile update returned 0 rows, check if RLS blocked it or if email has leading/trailing spaces
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .filter('email', 'ilike', `%${cleanEmail}%`)
      .maybeSingle();

    if (existingProfile) {
      const { data: updatedData, error: updateErr } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', existingProfile.id)
        .select();

      if (!updateErr && updatedData && updatedData.length > 0) {
        revalidatePath('/');
        return { success: true, message: `User ${cleanEmail} updated to ${role === 'verified' ? 'Super User / Pro' : role}.` };
      } else {
        return {
          success: false,
          message: 'Role update blocked by Supabase Row-Level Security (RLS). Ensure the RLS update policy is active.'
        };
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
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return (data as Profile[]) || [];
  } catch {
    return [];
  }
}
