import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getPresignedUploadUrl } from '@/lib/storage';
import { sanitizeTrackFilename } from '@/lib/audio/renamer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to upload files.' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, contentType, folder } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Valid filename is required.' }, { status: 400 });
    }

    const cleanFilename = sanitizeTrackFilename(filename, new Set<string>());
    const targetFolder = (folder && typeof folder === 'string') ? folder.replace(/[^a-zA-Z0-9_-]/g, '') : 'uploads';
    const key = `${targetFolder}/${user.id}/${Date.now()}_${cleanFilename}`;

    const presignData = await getPresignedUploadUrl(key, contentType || 'application/octet-stream');

    return NextResponse.json({
      uploadUrl: presignData.uploadUrl,
      key: presignData.key,
      publicUrl: presignData.publicUrl,
      storedFilename: cleanFilename,
      isR2: presignData.isR2,
    });
  } catch (err: any) {
    console.error('[storage/presign] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate presigned upload URL.' }, { status: 500 });
  }
}
