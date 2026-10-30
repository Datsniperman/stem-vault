import { isUserAdmin } from '@/lib/auth/admin';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import {
  uploadBlob,
  validateBetaUploadQuotas,
  PER_FILE_CAP_BYTES,
} from '@/lib/storage';
import { extractAudioDuration } from '@/lib/audio/duration';
import { sanitizeTrackFilename } from '@/lib/audio/renamer';

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

    if (file.size > PER_FILE_CAP_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds beta limit of 500 MB (provided: ${(file.size / (1024 * 1024)).toFixed(1)} MB).` },
        { status: 400 }
      );
    }

    const quotaCheck = await validateBetaUploadQuotas(user.id, file.size);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.error }, { status: 403 });
    }

    const pool = getDbPool();

    // Verify multi_id if provided
    if (multiId) {
      const multiCheck = await pool.query(`SELECT id FROM public.multis WHERE id = $1`, [multiId]);
      if (multiCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Specified multi not found.' }, { status: 404 });
      }
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

    return NextResponse.json({
      success: true,
      mix: insertRes.rows[0],
      message: 'Mix uploaded successfully!',
    });
  } catch (err: any) {
    console.error('[mixes/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Error uploading mix.' }, { status: 500 });
  }
}
