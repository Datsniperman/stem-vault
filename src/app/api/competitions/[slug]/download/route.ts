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

    const compRes = await pool.query(
      `SELECT id, title, slug, "multitrackUrl", "multitrackId", "earlyAccessEndsAt"
       FROM public."Competition"
       WHERE slug = $1 OR id = $1
       LIMIT 1`,
      [slug]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Competition not found.' }, { status: 404 });
    }

    const competition = compRes.rows[0];
    const now = new Date();
    const earlyAccessEnds = competition.earlyAccessEndsAt ? new Date(competition.earlyAccessEndsAt) : null;
    const isEarlyAccessActive = Boolean(earlyAccessEnds && now < earlyAccessEnds);

    if (isEarlyAccessActive) {
      const db = await createDbServerClient();
      const { data: { user } } = await db.auth.getUser();

      if (!user) {
        return NextResponse.json(
          {
            error: 'Sign in with Discord required. Members receive 3-day early access to competition stems.',
            code: 'EARLY_ACCESS_RESTRICTED',
            earlyAccessEndsAt: competition.earlyAccessEndsAt,
          },
          { status: 403 }
        );
      }

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

      if (!isAdmin && !hasMemberTier) {
        return NextResponse.json(
          {
            error: `Exclusive 3-Day Early Access: Multitrack stems unlock for everyone on ${earlyAccessEnds?.toLocaleDateString()} at ${earlyAccessEnds?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Upgrade to Plus or Premium for immediate access.`,
            code: 'EARLY_ACCESS_RESTRICTED',
            earlyAccessEndsAt: competition.earlyAccessEndsAt,
          },
          { status: 403 }
        );
      }
    }

    // If linked to a vault multi
    if (competition.multitrackId) {
      return NextResponse.redirect(new URL(`/api/multis/${competition.multitrackId}/download`, _request.url));
    }

    // If external or direct storage URL
    if (competition.multitrackUrl) {
      return NextResponse.redirect(competition.multitrackUrl);
    }

    return NextResponse.json(
      { error: 'Multitrack download files are currently being finalized. Please check back shortly.' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[competition/download] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to download multitrack.' }, { status: 500 });
  }
}
