import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import {
  uploadBlob,
  validateBetaUploadQuotas,
  PER_FILE_CAP_BYTES,
} from '@/lib/storage';
import { sanitizeTrackFilename } from '@/lib/audio/renamer';
import { extractAudioDuration } from '@/lib/audio/duration';

export const dynamic = 'force-dynamic';

const ALLOWED_AUDIO_EXTENSIONS = new Set(['.wav', '.flac', '.mp3', '.aiff', '.aif', '.ogg']);
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.dll', '.scr', '.ps1',
  '.com', '.bin', '.reg', '.inf', '.jar', '.vbe', '.wsf', '.hta', '.cpl'
]);

export async function POST(request: NextRequest) {
  let tempZipPath: string | null = null;
  let tempExtractDir: string | null = null;

  try {
    // 1. Authenticate user
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to upload a multi.' }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const title = (formData.get('title') as string || '').trim();
    const description = (formData.get('description') as string || '').trim() || null;
    const file = formData.get('file') as File | null;

    if (!title) {
      return NextResponse.json({ error: 'Multi title is required.' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No ZIP file provided.' }, { status: 400 });
    }

    // 3. File size and quota verification
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

    // 4. Save ZIP to temporary location for validation and inspection
    const tempDir = os.tmpdir();
    tempZipPath = path.join(tempDir, `multi-upload-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempZipPath, fileBuffer);

    // 5. Open and validate ZIP contents
    let zip: AdmZip;
    try {
      zip = new AdmZip(tempZipPath);
    } catch {
      return NextResponse.json(
        { error: 'The uploaded file is not a valid or readable ZIP archive.' },
        { status: 400 }
      );
    }

    const entries = zip.getEntries();
    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'The ZIP archive is empty.' }, { status: 400 });
    }

    // 6. Security & extension validation
    const audioEntries: AdmZip.IZipEntry[] = [];

    for (const entry of entries) {
      // Ignore directory entries
      if (entry.isDirectory) continue;

      const rawName = entry.entryName;

      // Skip macOS system junk files
      if (rawName.includes('__MACOSX') || path.basename(rawName).startsWith('._') || path.basename(rawName) === '.DS_Store') {
        continue;
      }

      // Zip-Slip protection: ensure no path segment navigates upwards
      const pathSegments = rawName.split(/[/\\]/);
      if (pathSegments.includes('..') || path.isAbsolute(rawName)) {
        return NextResponse.json(
          { error: `Security violation: archive entry contains invalid path '${rawName}'.` },
          { status: 400 }
        );
      }

      // Check for executables or scripts
      const ext = path.extname(rawName).toLowerCase();
      if (DANGEROUS_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `Executable or script detected in ZIP: '${path.basename(rawName)}'. Only audio tracks are allowed.` },
          { status: 400 }
        );
      }

      // Check audio extension
      if (!ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            error: `Unsupported file in ZIP: '${path.basename(rawName)}'. Audio files only for tracks: WAV, FLAC, MP3, AIFF, OGG.`,
          },
          { status: 400 }
        );
      }

      audioEntries.push(entry);
    }

    if (audioEntries.length === 0) {
      return NextResponse.json(
        { error: 'No valid audio tracks found in the ZIP archive (WAV, FLAC, MP3, AIFF, OGG).' },
        { status: 400 }
      );
    }

    // 7. Extract to temporary folder for processing
    tempExtractDir = fs.mkdtempSync(path.join(tempDir, 'multi-extracted-'));

    // 8. Create Multi record in database
    const pool = getDbPool();
    const multiRes = await pool.query(
      `INSERT INTO public.multis (owner_id, title, description, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       RETURNING id, owner_id, title, description, created_at`,
      [user.id, title, description]
    );

    const multi = multiRes.rows[0];
    const multiId = multi.id;

    // 9. Process tracks: rename, calculate duration, upload to storage, insert to DB
    const existingStoredNames = new Set<string>();
    const renameMappings: Array<{ original: string; stored: string; size_bytes: number; duration_seconds: number | null }> = [];
    const mimeMap: Record<string, string> = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.flac': 'audio/flac',
      '.aiff': 'audio/aiff',
      '.aif': 'audio/aiff',
      '.ogg': 'audio/ogg',
    };

    // Sort entries naturally so track 01, 02 etc remain in logical order
    audioEntries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    for (const entry of audioEntries) {
      const originalFilename = entry.name;
      const storedFilename = sanitizeTrackFilename(originalFilename, existingStoredNames);

      const entryBuffer = entry.getData();
      const ext = path.extname(storedFilename).toLowerCase();
      const format = ext.replace('.', '').toUpperCase();
      const contentType = mimeMap[ext] || 'audio/wav';

      const durationSeconds = extractAudioDuration(entryBuffer, ext);
      const storageKey = `multis/${multiId}/${storedFilename}`;

      // Upload to storage (R2 or local fallback)
      const uploadRes = await uploadBlob(storageKey, entryBuffer, contentType);

      // Save track metadata to Postgres
      await pool.query(
        `INSERT INTO public.multi_tracks
          (multi_id, stored_filename, original_filename, format, size_bytes, r2_key, public_url, duration_seconds, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
        [
          multiId,
          storedFilename,
          originalFilename,
          format,
          entryBuffer.length,
          storageKey,
          uploadRes.publicUrl,
          durationSeconds,
        ]
      );

      renameMappings.push({
        original: originalFilename,
        stored: storedFilename,
        size_bytes: entryBuffer.length,
        duration_seconds: durationSeconds,
      });
    }

    return NextResponse.json({
      success: true,
      multi,
      tracks_count: audioEntries.length,
      rename_mappings: renameMappings,
      message: `Successfully uploaded ${audioEntries.length} audio tracks.`,
    });
  } catch (err: any) {
    console.error('[multis/upload] Error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during upload.' },
      { status: 500 }
    );
  } finally {
    // 10. Clean up temporary files
    if (tempZipPath) {
      try {
        fs.unlinkSync(tempZipPath);
      } catch {}
    }
    if (tempExtractDir) {
      try {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
