import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { announceMultitrack } from '@/lib/discord';
import { isUserAdmin } from '@/lib/auth/admin';

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
  request: NextRequest,
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
        m.church,
        m.bpm,
        m.song_key,
        m.description,
        m.discord_message_id,
        m.discord_thread_id,
        m.zip_r2_key,
        m.zip_size_bytes,
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
    let isAuthorizedAdmin = user.role === 'admin';
    if (!isAuthorizedAdmin) {
      isAuthorizedAdmin = isUserAdmin({
        email: user.email,
        discordId:
          (user as any).discord_id ||
          user.user_metadata?.discord_id ||
          user.user_metadata?.provider_id ||
          (user as any).sub,
        username:
          user.user_metadata?.server_display_name ||
          user.user_metadata?.display_name ||
          (user as any).display_name,
        role: user.role,
        userMetadata: user.user_metadata,
        roles: user.user_metadata?.roles || (user as any).roles || [],
      });
    }

    if (!isAuthorizedAdmin) {
      try {
        const profRes = await pool.query('SELECT role FROM public.profiles WHERE id = $1', [user.id]);
        if (profRes.rows[0]?.role === 'admin') {
          isAuthorizedAdmin = true;
        }
      } catch {}
    }

    if (multi.owner_id !== user.id && !isAuthorizedAdmin) {
      return NextResponse.json({ error: 'Not authorized to publish this multitrack.' }, { status: 403 });
    }

    // Check if already published unless forced
    const force = request.nextUrl.searchParams.get('force') === 'true';
    if (multi.discord_message_id && !force) {
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

    if (trackCount === 0 && !multi.zip_r2_key) {
      return NextResponse.json(
        { error: 'Cannot publish a multitrack with no uploaded tracks or ZIP archive.' },
        { status: 400 }
      );
    }

    const totalSizeBytes = tracks.length > 0
      ? tracks.reduce((acc: number, t: any) => acc + Number(t.size_bytes || 0), 0)
      : Number(multi.zip_size_bytes || 0);
    const formattedSize = formatBytes(totalSizeBytes);

    // Build preview list of track names (up to first 8 tracks)
    const trackNames = tracks.map((t: any) => {
      const name = t.original_filename || t.stored_filename || '';
      return name.replace(/\.[^/.]+$/, '');
    });
    let tracksPreview = trackNames.slice(0, 8).join(', ');
    if (trackNames.length > 8) {
      tracksPreview += ` +${trackNames.length - 8} more`;
    }

    // Extract BPM and Key from columns, falling back to description if needed
    const desc = multi.description || '';
    const bpmMatch = desc.match(/(\d{2,3})\s*(?:bpm)?/i);
    const bpmVal = multi.bpm || (bpmMatch ? parseInt(bpmMatch[1], 10) : null);
    const keyMatch = desc.match(/\b([A-G][b#]?(?:m|maj|min|major|minor)?)\b/i);
    const keyVal = multi.song_key || (keyMatch ? keyMatch[1] : null);
    const churchVal = multi.church || 'Community Worship';

    // 3. Announce to Discord multitracks channel
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mixingvault.com').trim().replace(/\/+$/, '').replace(/^["']|["']$/g, '');
    const disc = await announceMultitrack({
      stemId: multi.id,
      title: multi.title,
      artist: churchVal,
      bpm: bpmVal,
      key: keyVal,
      trackCount: trackCount > 0 ? trackCount : null,
      totalSize: formattedSize,
      tracksPreview: tracksPreview || null,
      downloadUrl: `${siteUrl}/multis/${multi.id}`,
      uploaderHandle: multi.uploader_name,
      discordId: multi.discord_id || null,
    });

    if (!disc.messageId) {
      return NextResponse.json(
        { error: 'Failed to announce multitrack to Discord. Please check Discord bot token and channel settings.' },
        { status: 500 }
      );
    }

    await pool.query(
      `UPDATE public.multis
       SET discord_message_id = $1, discord_thread_id = $2, updated_at = now()
       WHERE id = $3`,
      [disc.messageId, disc.threadId, multi.id]
    );

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
