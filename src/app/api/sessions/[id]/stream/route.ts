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
      `SELECT id, title, video_asset_id, video_url, storage_provider, required_tier
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
      // Cloudflare Stream HLS manifest URL
      const cfManifestUrl = `https://customer-${process.env.CLOUDFLARE_STREAM_SUBDOMAIN || 'delivery'}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
      return NextResponse.redirect(cfManifestUrl);
    }

    // If direct HLS manifest URL exists
    const manifestUrl = session.video_url || session.video_asset_id;
    if (manifestUrl.startsWith('http://') || manifestUrl.startsWith('https://')) {
      const manifestRes = await fetch(manifestUrl, { cache: 'no-store' });
      if (!manifestRes.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch upstream HLS manifest' },
          { status: 502 }
        );
      }

      let manifestContent = await manifestRes.text();

      // Resolve base URL for relative chunk paths
      const manifestBaseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);

      // Rewrite relative .ts / .m4s / .m3u8 URLs to proxy through our authenticated chunk endpoint
      const rewrittenLines = manifestContent.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        // If line is an absolute URL, proxy through chunk route with base64 encoded URL
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

    // Fallback: If stored in R2 / local HLS
    return NextResponse.json(
      { error: 'HLS stream configuration pending for asset.' },
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
