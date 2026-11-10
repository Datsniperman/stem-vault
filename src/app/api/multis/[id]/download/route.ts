import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { uploadBlob } from '@/lib/storage';
import { createDbServerClient } from '@/lib/db/server';
import { canAccessProMultitracks } from '@/lib/auth/tiers';
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
      `SELECT id, title, is_pro, zip_public_url, zip_r2_key, zip_size_bytes, zip_last_downloaded_at, zip_status
       FROM public.multis
       WHERE id = $1`,
      [id]
    );

    if (multiRes.rows.length === 0) {
      return NextResponse.json({ error: 'Multi not found' }, { status: 404 });
    }

    const multi = multiRes.rows[0];

    // Gating check for Pro Multitracks
    if (multi.is_pro) {
      const db = await createDbServerClient();
      const { data: { user } } = await db.auth.getUser();

      let allowed = Boolean(user && canAccessProMultitracks(user));

      // Fallback: If not recognized from JWT metadata, check Discord live
      if (!allowed && user) {
        const anyUser = user as any;
        const discordId =
          anyUser.discord_id ||
          anyUser.user_metadata?.discord_id ||
          anyUser.user_metadata?.provider_id ||
          anyUser.sub;

        let effectiveDiscordId = discordId;
        if (!effectiveDiscordId || String(effectiveDiscordId).length < 15) {
          try {
            const prof = await pool.query(
              'SELECT discord_id FROM public.profiles WHERE id = $1 LIMIT 1',
              [user.id]
            );
            if (prof.rows[0]?.discord_id) {
              effectiveDiscordId = prof.rows[0].discord_id;
            }
          } catch {}
        }

        if (effectiveDiscordId && process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) {
          try {
            const discordRes = await fetch(
              `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${effectiveDiscordId}`,
              {
                headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
                cache: 'no-store',
              }
            );
            if (discordRes.ok) {
              const member = await discordRes.json();
              const liveRoles: string[] = Array.isArray(member.roles) ? member.roles : [];
              if (
                liveRoles.includes('1488271670119633047') ||
                liveRoles.includes('1488346107351269526') ||
                liveRoles.includes('1553858763474214912')
              ) {
                allowed = true;
                // Asynchronously persist to Postgres so future downloads don't need live check
                pool.query(
                  `UPDATE auth.users
                   SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || $1::jsonb
                   WHERE id = $2`,
                  [JSON.stringify({ roles: liveRoles, has_membership: true }), user.id]
                ).catch(() => null);
              }
            }
          } catch (e: any) {
            console.warn('[multis/download] Discord live check error:', e?.message);
          }
        }
      }

      if (!allowed) {
        return NextResponse.json(
          {
            error: 'Pro Multitracks are exclusive to Premium Tier members.',
            requiredTier: 'PREMIUM',
            upgradeUrl: '/membership',
          },
          { status: 403 }
        );
      }
    }

    const safeTitle = (multi.title || 'multitrack').replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. If full pre-compressed ZIP archive is cached in Cloudflare R2 and not marked expired:
    // Update last_downloaded_at (rolling 7-day window) and redirect directly to R2 edge
    if (multi.zip_public_url && multi.zip_status !== 'expired') {
      await pool
        .query(
          `UPDATE public.multis
           SET zip_last_downloaded_at = NOW(),
               zip_status = 'ready'
           WHERE id = $1`,
          [id]
        )
        .catch((err) => {
          console.warn('[multis/download] Could not touch zip_last_downloaded_at:', err);
        });

      return NextResponse.redirect(multi.zip_public_url, { status: 302 });
    }

    // 2. On-demand generation: The zip was either expired or not yet created.
    // Fetch all individual stems and package them.
    const tracksRes = await pool.query(
      `SELECT stored_filename, original_filename, public_url
       FROM public.multi_tracks
       WHERE multi_id = $1
       ORDER BY stored_filename ASC`,
      [id]
    );

    if (tracksRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'No audio tracks found to package into a ZIP archive.' },
        { status: 404 }
      );
    }

    // Mark status as generating
    await pool
      .query(`UPDATE public.multis SET zip_status = 'generating' WHERE id = $1`, [id])
      .catch(() => null);

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

    // 3. Save the generated ZIP archive into Cloudflare R2 cache for 7 days
    const r2Key = `multis/${id}/zip/${Date.now()}_${safeTitle}_stems.zip`;
    let publicDownloadUrl = '';

    try {
      const uploadRes = await uploadBlob(r2Key, Buffer.from(zipBuffer), 'application/zip');
      publicDownloadUrl = uploadRes.publicUrl;

      // Update database record with the new cached ZIP, setting zip_last_downloaded_at to NOW()
      await pool.query(
        `UPDATE public.multis
         SET zip_r2_key = $1,
             zip_public_url = $2,
             zip_size_bytes = $3,
             zip_last_downloaded_at = NOW(),
             zip_status = 'ready'
         WHERE id = $4`,
        [uploadRes.key, uploadRes.publicUrl, zipBuffer.length, id]
      );
    } catch (uploadErr: any) {
      console.warn('[multis/download] Failed to persist generated ZIP to R2 cache:', uploadErr);
      // Fallback: reset status to expired if caching failed
      await pool
        .query(`UPDATE public.multis SET zip_status = 'expired' WHERE id = $1`, [id])
        .catch(() => null);
    }

    // If R2 caching succeeded, redirect directly to Cloudflare R2 URL
    if (publicDownloadUrl) {
      return NextResponse.redirect(publicDownloadUrl, { status: 302 });
    }

    // Direct streaming response fallback if R2 upload was not possible
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
    return NextResponse.json(
      { error: err.message || 'Failed to download multitrack session.' },
      { status: 500 }
    );
  }
}
