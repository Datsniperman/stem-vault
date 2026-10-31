import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pool = getDbPool();

    const multiRes = await pool.query(
      `SELECT id, title, zip_public_url, zip_r2_key, zip_size_bytes
       FROM public.multis
       WHERE id = $1`,
      [id]
    );

    if (multiRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found' }, { status: 404 });
    }

    const multi = multiRes.rows[0];
    const safeTitle = (multi.title || 'multitrack').replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. If full pre-compressed ZIP archive is present in Cloudflare R2, redirect directly to download
    if (multi.zip_public_url) {
      return NextResponse.redirect(multi.zip_public_url, { status: 302 });
    }

    // 2. Fallback: pack all individual stems on-the-fly
    const tracksRes = await pool.query(
      `SELECT stored_filename, original_filename, public_url
       FROM public.multi_tracks
       WHERE multi_id = $1
       ORDER BY stored_filename ASC`,
      [id]
    );

    if (tracksRes.rows.length === 0) {
      return NextResponse.json({ error: 'No audio tracks found to package into a ZIP archive.' }, { status: 404 });
    }

    const zip = new JSZip();

    for (const track of tracksRes.rows) {
      if (!track.public_url) continue;
      try {
        const audioRes = await fetch(track.public_url);
        if (audioRes.ok) {
          const arrayBuf = await audioRes.arrayBuffer();
          const filename = track.original_filename || track.stored_filename;
          zip.file(filename, arrayBuf);
        }
      } catch (err) {
        console.warn(`[multis/download] Could not bundle track ${track.stored_filename}:`, err);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'STORE',
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeTitle}_stems.zip"`,
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[multis/download] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to download multitrack session.' }, { status: 500 });
  }
}
