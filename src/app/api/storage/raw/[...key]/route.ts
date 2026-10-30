import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLocalFallbackFilePath, getR2ConfigStatus } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await context.params;
    const storageKey = key.join('/');

    // Security check: no path traversal
    if (storageKey.includes('..')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    const r2Status = getR2ConfigStatus();
    if (r2Status.isConfigured && r2Status.publicUrl) {
      // In R2 mode, redirect to R2 public URL
      const publicBase = r2Status.publicUrl.replace(/\/+$/, '');
      return NextResponse.redirect(`${publicBase}/${storageKey}`);
    }

    // Local fallback mode: stream from disk with HTTP Range support
    const localFilePath = getLocalFallbackFilePath(storageKey);
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(localFilePath);
    const fileSize = stat.size;
    const ext = path.extname(localFilePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.flac': 'audio/flac',
      '.aiff': 'audio/aiff',
      '.aif': 'audio/aiff',
      '.ogg': 'audio/ogg',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      // Parse Range header e.g. "bytes=0-1048575" or "bytes=1048576-"
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(localFilePath, { start, end });
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Full file stream
    const fileStream = fs.createReadStream(localFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('[storage/raw] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
