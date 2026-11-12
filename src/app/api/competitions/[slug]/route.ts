import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';
import { createDbServerClient } from '@/lib/db/server';
import { isUserAdmin } from '@/lib/auth/admin';
import { canAccessProMultitracks } from '@/lib/auth/tiers';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const pool = getDbPool();

    // 1. Fetch competition by slug or id
    const compRes = await pool.query(
      `SELECT
        c.id,
        c."guildId",
        c.title,
        c.slug,
        c.description,
        c.rules,
        c."multitrackUrl",
        c."multitrackId",
        c.deadline,
        c."earlyAccessEndsAt",
        c."publicReleaseAt",
        c."hubChannelId",
        c."adminChannelId",
        c."categoryId",
        c."hubMessageId",
        c.status,
        c."createdBy",
        c."isSpecialLinkOnly",
        c."bannerUrl",
        c."sponsorOrPrize",
        c."maxSubmissionsPerUser",
        c."createdAt",
        c."updatedAt",
        COUNT(s.id)::int AS submission_count
       FROM public."Competition" c
       LEFT JOIN public."CompetitionSubmission" s ON c.id = s."competitionId" AND s.status = 'SUBMITTED'
       WHERE c.slug = $1 OR c.id = $1
       GROUP BY c.id
       LIMIT 1`,
      [slug]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Competition not found.' }, { status: 404 });
    }

    const competition = compRes.rows[0];

    // 2. Check user session
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    let userState = {
      isLoggedIn: false,
      discordId: null as string | null,
      username: null as string | null,
      hasEarlyAccess: false,
      hasSubmitted: false,
      submission: null as any,
      isEarlyAccessActive: false,
      canDownload: true,
    };

    const now = new Date();
    const earlyAccessEnds = competition.earlyAccessEndsAt ? new Date(competition.earlyAccessEndsAt) : null;
    const isEarlyAccessActive = Boolean(earlyAccessEnds && now < earlyAccessEnds);

    if (user) {
      const anyUser = user as any;
      const userMeta = anyUser.user_metadata || {};
      const discordId =
        anyUser.discord_id ||
        userMeta.discord_id ||
        userMeta.provider_id ||
        anyUser.sub ||
        null;

      const isAdmin = Boolean(
        user.role === 'admin' ||
        userMeta.role === 'admin' ||
        isUserAdmin({
          email: user.email,
          discordId,
          username: userMeta.display_name || userMeta.server_display_name,
          role: user.role,
          userMetadata: userMeta,
          roles: userMeta.roles || [],
        })
      );

      const hasMemberTier = canAccessProMultitracks(user);
      const hasEarlyAccess = isAdmin || hasMemberTier;

      // Check if user has already submitted
      let submission = null;
      if (discordId) {
        const subRes = await pool.query(
          `SELECT
            id,
            "competitionId",
            "userId",
            "userTag",
            "audioUrl",
            "audioFilename",
            "audioFilesize",
            "dawOrConsole",
            "mixNotes",
            status,
            "createdAt"
           FROM public."CompetitionSubmission"
           WHERE "competitionId" = $1 AND "userId" = $2 AND status = 'SUBMITTED'
           LIMIT 1`,
          [competition.id, String(discordId).trim()]
        );
        if (subRes.rows.length > 0) {
          submission = subRes.rows[0];
        }
      }

      userState = {
        isLoggedIn: true,
        discordId,
        username: userMeta.server_display_name || userMeta.display_name || user.email?.split('@')[0] || 'Member',
        hasEarlyAccess,
        hasSubmitted: Boolean(submission),
        submission,
        isEarlyAccessActive,
        canDownload: !isEarlyAccessActive || hasEarlyAccess,
      };
    } else {
      userState = {
        isLoggedIn: false,
        discordId: null,
        username: null,
        hasEarlyAccess: false,
        hasSubmitted: false,
        submission: null,
        isEarlyAccessActive,
        canDownload: !isEarlyAccessActive,
      };
    }

    return NextResponse.json({
      success: true,
      competition,
      userState,
    });
  } catch (err: any) {
    console.error('[competition/detail] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch competition.' }, { status: 500 });
  }
}
