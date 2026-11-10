import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { verifyStreamToken } from '@/lib/video/tokens';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Forbidden: Stream token required.', code: 'TOKEN_REQUIRED' },
        { status: 403 }
      );
    }

    const tokenPayload = verifyStreamToken(token, id);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid or expired stream token.', code: 'INVALID_TOKEN' },
        { status: 403 }
      );
    }

    const pool = getDbPool();
    const result = await pool.query(
      `SELECT id, title, video_asset_id, video_url, storage_provider
       FROM public.recorded_sessions
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = result.rows[0];

    // If Cloudflare Stream
    if (session.storage_provider === 'cloudflare_stream') {
      const streamId = session.video_asset_id;
      const cfManifestUrl = `https://customer-${process.env.CLOUDFLARE_STREAM_SUBDOMAIN || 'delivery'}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
      return NextResponse.redirect(cfManifestUrl);
    }

    // Direct HLS manifest or video file URL
    const targetUrl = session.video_url || session.video_asset_id;
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      const isM3u8 = targetUrl.toLowerCase().includes('.m3u8');

      if (isM3u8) {
        // HLS playlist processing
        const manifestRes = await fetch(targetUrl, { cache: 'no-store' });
        if (!manifestRes.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch upstream HLS manifest' },
            { status: 502 }
          );
        }

        const manifestContent = await manifestRes.text();
        const manifestBaseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

        const rewrittenLines = manifestContent.split('\n').map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;

          const chunkUrl = trimmed.startsWith('http') ? trimmed : `${manifestBaseUrl}${trimmed}`;
          const encodedChunk = Buffer.from(chunkUrl).toString('base64url');
          return `/api/sessions/${id}/stream/chunks/${encodedChunk}?token=${encodeURIComponent(token)}`;
        });

        return new NextResponse(rewrittenLines.join('\n'), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Direct Video File (e.g. .mp4, .mov, .webm) via secure tokenized Range chunk streaming
      const range = request.headers.get('range');
      const fetchHeaders: Record<string, string> = {};
      if (range) {
        fetchHeaders['Range'] = range;
      }

      const videoRes = await fetch(targetUrl, {
        headers: fetchHeaders,
        cache: 'no-store',
      });

      if (!videoRes.ok && videoRes.status !== 206) {
        return NextResponse.json(
          { error: `Upstream storage error: ${videoRes.status}` },
          { status: 502 }
        );
      }

      const contentType = videoRes.headers.get('content-type') || 'video/mp4';
      const contentRange = videoRes.headers.get('content-range');
      const contentLength = videoRes.headers.get('content-length');

      const responseHeaders: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
      };

      if (contentRange) responseHeaders['Content-Range'] = contentRange;
      if (contentLength) responseHeaders['Content-Length'] = contentLength;

      return new NextResponse(videoRes.body as any, {
        status: videoRes.status,
        headers: responseHeaders,
      });
    }

    return NextResponse.json(
      { error: 'Invalid video stream target configuration.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[sessions/stream] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Stream generation failed' },
      { status: 500 }
    );
  }
}
