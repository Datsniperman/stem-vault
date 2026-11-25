import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { canAccessProMultitracks } from '@/lib/auth/tiers';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

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

    // 1. If full pre-compressed ZIP archive is cached in Cloudflare R2 and ready:
    // Update last_downloaded_at (rolling window) and redirect directly to R2 edge
    if (multi.zip_public_url && multi.zip_status === 'ready') {
      await pool
        .query(
          `UPDATE public.multis
           SET zip_last_downloaded_at = NOW()
           WHERE id = $1`,
          [id]
        )
        .catch((err) => {
          console.warn('[multis/download] Could not touch zip_last_downloaded_at:', err);
        });

      return NextResponse.redirect(multi.zip_public_url, { status: 302 });
    }

    // 2. If the zip is currently generating in background, notify client
    if (multi.zip_status === 'generating') {
      return NextResponse.json(
        {
          error: 'The ZIP archive for this session is currently being packaged in the background. Please wait 1-2 minutes and try again.',
          status: 'generating',
        },
        { status: 202 }
      );
    }

    // 3. If zip is missing or expired, schedule safe background stream generation
    await pool
      .query(`UPDATE public.multis SET zip_status = 'generating' WHERE id = $1`, [id])
      .catch(() => null);

    try {
      const scriptPath = path.join(process.cwd(), '..', '..', 'scripts', 'generate-missing-zips.js');
      if (fs.existsSync(scriptPath)) {
        const child = spawn(process.execPath, [scriptPath], {
          detached: true,
          stdio: 'ignore',
          cwd: process.cwd(),
        });
        child.unref();
      }
    } catch (spawnErr) {
      console.warn('[multis/download] Could not spawn background packager:', spawnErr);
    }

    return NextResponse.json(
      {
        error: 'The ZIP archive is being generated in the background. Please wait 1 to 2 minutes and click Download again.',
        status: 'generating',
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error('[multis/download] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to download multitrack session.' },
      { status: 500 }
    );
  }
}
