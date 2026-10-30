import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLocalFallbackFilePath, getR2ConfigStatus } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const filename = searchParams.get('filename') || path.basename(key || 'download.audio');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    if (key.includes('..')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    const r2Status = getR2ConfigStatus();
    if (r2Status.isConfigured && r2Status.publicUrl) {
      // In R2 mode, redirect or fetch and pipe with attachment header
      const publicBase = r2Status.publicUrl.replace(/\/+$/, '');
      const downloadUrl = `${publicBase}/${key}`;

      // To guarantee exact attachment filename in browser, proxy stream with Content-Disposition
      const s3Res = await fetch(downloadUrl);
      if (!s3Res.ok) {
        return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: s3Res.status });
      }

      const safeFilename = encodeURIComponent(filename).replace(/['()]/g, escape);
      return new NextResponse(s3Res.body, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${safeFilename}`,
          'Content-Type': s3Res.headers.get('content-type') || 'application/octet-stream',
          'Content-Length': s3Res.headers.get('content-length') || '',
        },
      });
    }

    // Local fallback mode: stream directly from disk
    const localFilePath = getLocalFallbackFilePath(key);
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(localFilePath);
    const fileStream = fs.createReadStream(localFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    const safeFilename = encodeURIComponent(filename).replace(/['()]/g, escape);

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${safeFilename}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size.toString(),
      },
    });
  } catch (err: any) {
    console.error('[storage/download] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
