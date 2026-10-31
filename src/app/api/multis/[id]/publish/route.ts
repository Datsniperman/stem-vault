import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { announceMultitrack } from '@/lib/discord';

export const dynamic = 'force-dynamic';

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await createDbServerClient();
    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to publish.' }, { status: 401 });
    }

    const pool = getDbPool();

    // 1. Fetch multi and owner profile
    const multiRes = await pool.query(
      `SELECT
        m.id,
        m.owner_id,
        m.title,
        m.description,
        m.discord_message_id,
        m.discord_thread_id,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS uploader_name,
        p.discord_id
      FROM public.multis m
      LEFT JOIN public.profiles p ON m.owner_id = p.id
      WHERE m.id = $1`,
      [id]
    );

    if (multiRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found.' }, { status: 404 });
    }

    const multi = multiRes.rows[0];

    // Check ownership or admin
    if (multi.owner_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to publish this multitrack.' }, { status: 403 });
    }

    // Check if already published
    if (multi.discord_message_id) {
      return NextResponse.json({
        message: 'Multitrack has already been announced to Discord.',
        messageId: multi.discord_message_id,
        threadId: multi.discord_thread_id,
      });
    }

    // 2. Fetch all uploaded tracks
    const tracksRes = await pool.query(
      `SELECT stored_filename, original_filename, size_bytes, format
       FROM public.multi_tracks
       WHERE multi_id = $1
       ORDER BY id ASC`,
      [id]
    );

    const tracks = tracksRes.rows;
    const trackCount = tracks.length;

    if (trackCount === 0) {
      return NextResponse.json(
        { error: 'Cannot publish a multitrack with 0 uploaded tracks.' },
        { status: 400 }
      );
    }

    const totalSizeBytes = tracks.reduce((acc: number, t: any) => acc + Number(t.size_bytes || 0), 0);
    const formattedSize = formatBytes(totalSizeBytes);

    // Build preview list of track names (up to first 8 tracks)
    const trackNames = tracks.map((t: any) => {
      const name = t.original_filename || t.stored_filename || '';
      return name.replace(/\.[^/.]+$/, ''); // remove extension
    });
    let tracksPreview = trackNames.slice(0, 8).join(', ');
    if (trackNames.length > 8) {
      tracksPreview += ` +${trackNames.length - 8} more`;
    }

    // 3. Announce to Discord multitracks channel (1565366257996275847)
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mixingvault.com').replace(/\/+$/, '');
    const disc = await announceMultitrack({
      stemId: multi.id,
      title: multi.title,
      artist: 'Community Worship',
      bpm: null,
      key: null,
      trackCount,
      totalSize: formattedSize,
      tracksPreview: tracksPreview || null,
      downloadUrl: `${siteUrl}/multis/${multi.id}`,
      uploaderHandle: multi.uploader_name,
      discordId: multi.discord_id || null,
    });

    if (disc.messageId || disc.threadId) {
      await pool.query(
        `UPDATE public.multis
         SET discord_message_id = $1, discord_thread_id = $2, updated_at = now()
         WHERE id = $3`,
        [disc.messageId, disc.threadId, multi.id]
      );
    }

    return NextResponse.json({
      success: true,
      messageId: disc.messageId,
      threadId: disc.threadId,
      trackCount,
      totalSize: formattedSize,
    });
  } catch (err: any) {
    console.error('[multis/publish] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to publish multitrack.' }, { status: 500 });
  }
}
