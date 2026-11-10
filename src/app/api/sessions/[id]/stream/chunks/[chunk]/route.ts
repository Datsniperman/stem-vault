import { NextRequest, NextResponse } from 'next/server';
import { verifyStreamToken } from '@/lib/video/tokens';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; chunk: string }> }
) {
  try {
    const { id, chunk } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Stream token required.' }, { status: 403 });
    }

    const payload = verifyStreamToken(token, id);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired stream token.' }, { status: 403 });
    }

    // Decode actual chunk upstream URL
    let targetUrl: string;
    try {
      targetUrl = Buffer.from(chunk, 'base64url').toString('utf-8');
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        throw new Error('Invalid URL');
      }
    } catch {
      return NextResponse.json({ error: 'Malformed chunk identifier.' }, { status: 400 });
    }

    // Forward range header if present for byte-range chunking
    const headers: Record<string, string> = {};
    const range = request.headers.get('range');
    if (range) {
      headers['Range'] = range;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers,
      cache: 'no-store',
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        { error: `Upstream chunk error: ${upstreamRes.status}` },
        { status: 502 }
      );
    }

    const contentType =
      upstreamRes.headers.get('content-type') || 'video/MP2T';
    const contentRange = upstreamRes.headers.get('content-range');
    const contentLength = upstreamRes.headers.get('content-length');

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    };

    if (contentRange) responseHeaders['Content-Range'] = contentRange;
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    return new NextResponse(upstreamRes.body as any, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('[sessions/chunks] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Chunk retrieval failed' },
      { status: 500 }
    );
  }
}
