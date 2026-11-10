import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, createUserToken } from '@/lib/db/jwt';
import { invalidateDiscordRoleCache } from '@/proxy';
import { isUserAdmin } from '@/lib/auth/admin';
import { getDbPool } from '@/lib/db/pool';

const DISCORD_BOT_TOKEN =
  (process.env.DISCORD_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');

const DISCORD_GUILD_ID =
  (process.env.DISCORD_GUILD_ID || '').trim().replace(/^["']|["']$/g, '') ||
  '1488266305743360252';

const STAFF_ADMIN_ROLE_ID =
  (process.env.DISCORD_ADMIN_ROLE_ID || '1553858763474214912').trim();

const REQUIRED_MEMBERSHIP_ROLE_ID =
  (process.env.DISCORD_REQUIRED_ROLE_ID || '1569410882822475837').trim();

const PLUS_ROLE_IDS = [REQUIRED_MEMBERSHIP_ROLE_ID, '1569410882822475837'];
const PREMIUM_ROLE_IDS = ['1488346107351269526', '1488271670119633047'];

export async function POST(request: NextRequest) {
  const sessionToken =
    request.cookies.get('mv_session_token')?.value ||
    request.cookies.get('sb-access-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyJwt<any>(sessionToken);
  if (!payload || !payload.sub) {
    return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
  }

  const pool = getDbPool();
  const userMetadata = payload.user_metadata || {};

  let discordId =
    payload.discord_id ||
    userMetadata.discord_id ||
    userMetadata.provider_id ||
    (payload.identities && payload.identities[0]?.id);

  // Fallback 1: Query public.profiles
  if (!discordId || String(discordId).length < 15) {
    try {
      const profRes = await pool.query(
        'SELECT discord_id FROM public.profiles WHERE id = $1 LIMIT 1',
        [payload.sub]
      );
      if (profRes.rows[0]?.discord_id) {
        discordId = profRes.rows[0].discord_id;
      }
    } catch (e: any) {
      console.warn('[refresh-membership] Failed to query profiles for discord_id:', e?.message);
    }
  }

  // Fallback 2: Query auth.identities
  if (!discordId || String(discordId).length < 15) {
    try {
      const idRes = await pool.query(
        "SELECT provider_id FROM auth.identities WHERE user_id = $1 AND provider = 'discord' LIMIT 1",
        [payload.sub]
      );
      if (idRes.rows[0]?.provider_id) {
        discordId = idRes.rows[0].provider_id;
      }
    } catch (e: any) {
      console.warn('[refresh-membership] Failed to query identities for discord_id:', e?.message);
    }
  }

  const isAdmin = isUserAdmin({
    email: payload.email,
    discordId: discordId || payload.sub,
    username: userMetadata.display_name || userMetadata.server_display_name,
    role: payload.role,
    userMetadata,
  });

  if (!discordId) {
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        hasMembership: true,
        tier: 'PREMIUM',
        roles: [],
      });
    }
    return NextResponse.json({
      success: false,
      hasMembership: false,
      message: 'No Discord account linked. Please sign in with Discord.',
    });
  }

  // Invalidate any cached status so we get the freshest roles from Discord
  invalidateDiscordRoleCache(discordId);

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}`,
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        cache: 'no-store',
      }
    );

    if (res.status === 404) {
      if (isAdmin) {
        return NextResponse.json({
          success: true,
          hasMembership: true,
          tier: 'PREMIUM',
          roles: [],
        });
      }
      return NextResponse.json({
        success: false,
        hasMembership: false,
        message: 'Your Discord account is not in the Tyler Kerpsack Discord server.',
      });
    }

    if (!res.ok) {
      if (isAdmin) {
        return NextResponse.json({
          success: true,
          hasMembership: true,
          tier: 'PREMIUM',
          roles: [],
        });
      }
      return NextResponse.json({
        success: false,
        hasMembership: false,
        message: `Discord check returned status ${res.status}.`,
      });
    }

    const memberData = await res.json();
    const roles: string[] = Array.isArray(memberData.roles) ? memberData.roles : [];
    const hasAdminRole = roles.includes(STAFF_ADMIN_ROLE_ID);
    const hasPremiumRole = PREMIUM_ROLE_IDS.some((id) => roles.includes(id));
    const hasPlusRole = PLUS_ROLE_IDS.some((id) => roles.includes(id));
    const hasRole = hasAdminRole || hasPremiumRole || hasPlusRole || isAdmin;

    if (!hasRole) {
      return NextResponse.json({
        success: false,
        hasMembership: false,
        message: 'Members role not detected yet. Please ensure checkout is complete, then try again.',
      });
    }

    const isUserEffectivelyAdmin = hasAdminRole || payload.role === 'admin' || isAdmin;
    const calculatedRole = isUserEffectivelyAdmin ? 'admin' : (payload.role || 'authenticated');
    const tier = isUserEffectivelyAdmin || hasPremiumRole ? 'PREMIUM' : (hasPlusRole ? 'PLUS' : 'FREE');

    const newMetadata = {
      ...userMetadata,
      discord_id: discordId,
      provider_id: discordId,
      has_membership: true,
      role: calculatedRole,
      roles,
    };

    // Update auth.users in Postgres so sessions and /api/auth/me remain synchronized
    try {
      await pool.query(
        `UPDATE auth.users
         SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || $1::jsonb,
             role = $2
         WHERE id = $3`,
        [JSON.stringify(newMetadata), calculatedRole, payload.sub]
      );
    } catch (err: any) {
      console.warn('[refresh-membership] Failed to update auth.users:', err?.message);
    }

    // Update public.profiles in Postgres
    try {
      await pool.query(
        `UPDATE public.profiles
         SET discord_id = COALESCE(discord_id, $1),
             role = $2
         WHERE id = $3`,
        [discordId, calculatedRole, payload.sub]
      );
    } catch (err: any) {
      console.warn('[refresh-membership] Failed to update public.profiles:', err?.message);
    }

    // Generate updated token and session
    const updatedUser: any = {
      id: payload.sub,
      email: payload.email,
      role: calculatedRole,
      user_metadata: newMetadata,
    };

    const newToken = createUserToken(updatedUser);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const cookieDomain = (!isLocal && host && host.includes('mixingvault.com')) ? '.mixingvault.com' : undefined;

    const cookieOptions: any = {
      httpOnly: true,
      secure: !isLocal,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };
    if (cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }

    const session = {
      access_token: newToken,
      token_type: 'bearer',
      user: updatedUser,
    };

    const response = NextResponse.json({
      success: true,
      hasMembership: true,
      tier,
      roles,
      session,
      user: updatedUser,
    });

    response.cookies.set('mv_session_token', newToken, cookieOptions);
    response.cookies.set('sb-access-token', newToken, cookieOptions);
    return response;
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      hasMembership: false,
      message: err?.message || 'Failed to check Discord server',
    }, { status: 500 });
  }
}
