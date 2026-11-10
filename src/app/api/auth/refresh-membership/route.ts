import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, createUserToken, signJwt } from '@/lib/db/jwt';
import { invalidateDiscordRoleCache } from '@/proxy';
import { isUserAdmin } from '@/lib/auth/admin';
import { getDbPool } from '@/lib/db/pool';

const DISCORD_BOT_TOKEN =
  (process.env.DISCORD_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');

const DISCORD_GUILD_ID =
  (process.env.DISCORD_GUILD_ID || '').trim().replace(/^["']|["']$/g, '') ||
  '1488266305743360252';

const REQUIRED_MEMBERSHIP_ROLE_ID =
  (process.env.DISCORD_REQUIRED_ROLE_ID || '1488271670119633047').trim();

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

  const userMetadata = payload.user_metadata || {};
  const discordId =
    payload.discord_id ||
    userMetadata.discord_id ||
    userMetadata.provider_id;

  const isAdmin = isUserAdmin({
    email: payload.email,
    discordId: discordId || payload.sub,
    username: userMetadata.display_name || userMetadata.server_display_name,
    role: payload.role,
    userMetadata,
  });

  if (isAdmin) {
    return NextResponse.json({ success: true, hasMembership: true });
  }

  if (!discordId) {
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
      return NextResponse.json({
        success: false,
        hasMembership: false,
        message: 'Your Discord account is not in the Tyler Kerpsack Discord server.',
      });
    }

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        hasMembership: false,
        message: `Discord check returned status ${res.status}.`,
      });
    }

    const memberData = await res.json();
    const roles: string[] = Array.isArray(memberData.roles) ? memberData.roles : [];
    const hasAdminRole = roles.includes('1553858763474214912');
    const hasRole = hasAdminRole || roles.includes(REQUIRED_MEMBERSHIP_ROLE_ID);

    if (!hasRole) {
      return NextResponse.json({
        success: false,
        hasMembership: false,
        message: 'Members role not detected yet. Please ensure checkout is complete, then try again.',
      });
    }

    const calculatedRole = (hasAdminRole || payload.role === 'admin') ? 'admin' : (payload.role || 'authenticated');

    if (hasAdminRole) {
      try {
        const pool = getDbPool();
        await pool.query("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [payload.sub]);
      } catch (err: any) {
        console.warn('[refresh-membership] Failed to update profile to admin:', err.message);
      }
    }

    // Role verified! Generate updated token and return success
    const updatedUser: any = {
      id: payload.sub,
      email: payload.email,
      role: calculatedRole,
      user_metadata: {
        ...userMetadata,
        discord_id: discordId,
        provider_id: discordId,
        has_membership: true,
        role: calculatedRole,
        roles,
      },
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

    const response = NextResponse.json({ success: true, hasMembership: true });
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
