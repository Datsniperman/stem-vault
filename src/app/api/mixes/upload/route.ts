import { isUserAdmin } from '@/lib/auth/admin';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { uploadBlob } from '@/lib/storage';
import { extractAudioDuration } from '@/lib/audio/duration';
import { sanitizeTrackFilename } from '@/lib/audio/renamer';
import { announceMix } from '@/lib/discord';

const ALLOWED_AUDIO_EXTENSIONS = new Set(['.wav', '.flac', '.mp3', '.aiff', '.aif', '.ogg']);

export async function POST(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to upload a mix.' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = (formData.get('title') as string || '').trim();
    const multiId = (formData.get('multi_id') as string || '').trim() || null;
    const file = formData.get('file') as File | null;

    if (!title) {
      return NextResponse.json({ error: 'Mix title is required.' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Unsupported audio format '${ext}'. Allowed formats: WAV, FLAC, MP3, AIFF, OGG.` },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Auto-upsert profile
    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Member';
    const avatarUrl = user.user_metadata?.avatar_url || null;
    const discordId = user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id) || null;

    await pool.query(
      `INSERT INTO public.profiles (id, email, display_name, server_display_name, avatar_url, discord_id, role)
       VALUES ($1, $2, $3, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
         avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url)`,
      [
        user.id,
        user.email || null,
        displayName,
        avatarUrl,
        discordId,
        user.role === 'admin' ? 'admin' : 'user',
      ]
    ).catch(e => console.warn('Could not auto-upsert profile in mixes/upload:', e.message));

    // Verify multi_id if provided
    let multiTitle: string | null = null;
    let threadId: string | null = null;
    if (multiId) {
      const multiCheck = await pool.query(`SELECT id, title, discord_thread_id FROM public.multis WHERE id = $1`, [multiId]);
      if (multiCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Specified multi not found.' }, { status: 404 });
      }
      multiTitle = multiCheck.rows[0].title;
      threadId = multiCheck.rows[0].discord_thread_id;
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storedFilename = sanitizeTrackFilename(file.name, new Set<string>());
    const format = ext.replace('.', '').toUpperCase();
    const durationSeconds = extractAudioDuration(fileBuffer, ext);

    const mixId = (await import('crypto')).randomUUID();
    const storageKey = `mixes/${mixId}/${storedFilename}`;

    const mimeMap: Record<string, string> = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.flac': 'audio/flac',
      '.aiff': 'audio/aiff',
      '.aif': 'audio/aiff',
      '.ogg': 'audio/ogg',
    };
    const contentType = mimeMap[ext] || 'audio/wav';

    // Upload to storage
    const uploadRes = await uploadBlob(storageKey, fileBuffer, contentType);

    // Insert mix into database
    const insertRes = await pool.query(
      `INSERT INTO public.mixes
        (id, owner_id, multi_id, title, format, size_bytes, r2_key, public_url, duration_seconds, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
       RETURNING *`,
      [
        mixId,
        user.id,
        multiId,
        title,
        format,
        fileBuffer.length,
        storageKey,
        uploadRes.publicUrl,
        durationSeconds,
      ]
    );

    const createdMix = insertRes.rows[0];

    // Announce to Discord
    try {
      const discordPostId = await announceMix({
        mixId: createdMix.id,
        title: createdMix.title,
        format: createdMix.format,
        publicUrl: createdMix.public_url,
        uploaderName: displayName,
        discordId,
        multiTitle,
        threadId,
      });

      if (discordPostId) {
        await pool.query(
          `UPDATE public.mixes SET discord_post_id = $1 WHERE id = $2`,
          [discordPostId, createdMix.id]
        ).catch(() => {});
      }
    } catch (discErr) {
      console.error('[mixes/upload] Discord announcement error:', discErr);
    }

    return NextResponse.json({
      success: true,
      mix: createdMix,
      message: 'Mix uploaded successfully!',
    });
  } catch (err: any) {
    console.error('[mixes/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Error uploading mix.' }, { status: 500 });
  }
}
