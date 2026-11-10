import { NextResponse, type NextRequest } from 'next/server';
import { isUserAdmin } from './lib/auth/admin';

const JWT_SECRET =
  (process.env.JWT_SECRET || '').trim().replace(/^["']|["']$/g, '') ||
  'super-secret-jwt-token-with-at-least-32-characters-kerpbot-mixingvault';

const DISCORD_BOT_TOKEN =
  (process.env.DISCORD_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');

const DISCORD_GUILD_ID =
  (process.env.DISCORD_GUILD_ID || '').trim().replace(/^["']|["']$/g, '') ||
  '1488266305743360252';

const REQUIRED_MEMBERSHIP_ROLE_ID =
  (process.env.DISCORD_REQUIRED_ROLE_ID || '1488271670119633047').trim();

const PRO_MEMBER_ROLE_ID =
  (process.env.DISCORD_PREMIUM_ROLE_ID || '1488346107351269526').trim();

const ADMIN_ROLE_ID =
  (process.env.DISCORD_ADMIN_ROLE_ID || '1553858763474214912').trim();

// In-memory cache for live Discord role checks
// 10-second TTL prevents Discord 429 rate-limiting during rapid page navigation while guaranteeing instant revocation upon subscription loss
interface CachedRole {
  hasRole: boolean;
  checkedAt: number;
}
const roleCache = new Map<string, CachedRole>();
const ROLE_CACHE_TTL_MS = 10 * 1000;

export function invalidateDiscordRoleCache(discordId?: string) {
  if (discordId) {
    roleCache.delete(discordId);
  } else {
    roleCache.clear();
  }
}

async function verifyLiveDiscordRole(discordId: string): Promise<boolean> {
  const cached = roleCache.get(discordId);
  const now = Date.now();
  if (cached && now - cached.checkedAt < ROLE_CACHE_TTL_MS) {
    return cached.hasRole;
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        cache: 'no-store',
      }
    );

    if (res.status === 404) {
      // User left or is not in the guild
      roleCache.set(discordId, { hasRole: false, checkedAt: now });
      return false;
    }

    if (!res.ok) {
      console.warn(`[Proxy] Discord API returned ${res.status} for member ${discordId}`);
      if (res.status === 429 && cached) {
        return cached.hasRole;
      }
      return false;
    }

    const data = await res.json();
    const roles: string[] = Array.isArray(data.roles) ? data.roles : [];
    const hasRole = roles.includes(REQUIRED_MEMBERSHIP_ROLE_ID) || roles.includes(PRO_MEMBER_ROLE_ID) || roles.includes(ADMIN_ROLE_ID);

    roleCache.set(discordId, { hasRole, checkedAt: now });
    return hasRole;
  } catch (err: any) {
    console.error(`[Proxy] Live Discord role check error for ${discordId}:`, err?.message);
    if (cached) return cached.hasRole;
    return false;
  }
}

/**
 * Edge-compatible JWT verification using Web Crypto API.
 */
async function verifyToken(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode and check expiration
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode base64url signature
    const binarySigStr = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const binarySignature = new Uint8Array(binarySigStr.length);
    for (let i = 0; i < binarySigStr.length; i++) {
      binarySignature[i] = binarySigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, binarySignature, dataToVerify);
    if (!isValid) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that must always be accessible without authentication or role verification
  const isPublicAssetOrAuth =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/sessions/') ||
    pathname.startsWith('/auth') ||
    pathname === '/membership' ||
    pathname === '/unauthorized' ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml';

  if (isPublicAssetOrAuth) {
    return NextResponse.next();
  }

  // Retrieve user session token from cookies
  const sessionToken =
    request.cookies.get('mv_session_token')?.value ||
    request.cookies.get('sb-access-token')?.value;

  // 1. If not authenticated at all
  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const membershipUrl = new URL('/membership', request.url);
    membershipUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(membershipUrl);
  }

  // 2. Verify token
  const payload = await verifyToken(sessionToken, JWT_SECRET);
  if (!payload || !payload.sub) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired session', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
    const membershipUrl = new URL('/membership', request.url);
    membershipUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(membershipUrl);
  }

  // 3. Extract identity
  const userMetadata = payload.user_metadata || {};
  const discordId =
    (payload.discord_id as string) ||
    (userMetadata.discord_id as string) ||
    (userMetadata.provider_id as string) ||
    null;

  // Master admin check: admins always have full access across the entire app
  const hasAdminRoleId = Array.isArray(userMetadata?.roles) && userMetadata.roles.includes('1553858763474214912');
  const isAdmin =
    payload.role === 'admin' ||
    userMetadata.role === 'admin' ||
    userMetadata.custom_claims?.role === 'admin' ||
    hasAdminRoleId ||
    isUserAdmin({
      email: payload.email,
      discordId: discordId || payload.sub,
      username: userMetadata.display_name || userMetadata.server_display_name,
      role: payload.role,
      userMetadata,
      roles: userMetadata?.roles,
    });

  if (isAdmin) {
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub);
    response.headers.set('x-user-role', 'admin');
    return response;
  }

  // 4. Non-admin users: must verify LIVE Discord role on every request
  let hasMembership = false;
  if (discordId) {
    hasMembership = await verifyLiveDiscordRole(discordId);
  }

  if (!hasMembership) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Forbidden: Members Discord role required (Role ID: 1488271670119633047).',
          code: 'MEMBERSHIP_REQUIRED',
          membershipUrl: 'https://www.launchpass.com/all-access-by-tyler/plus',
        },
        { status: 403 }
      );
    }

    const membershipUrl = new URL('/membership', request.url);
    membershipUrl.searchParams.set('reason', 'missing_role');
    membershipUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(membershipUrl);
  }

  // 5. User is verified and authorized
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.sub);
  response.headers.set('x-user-role', payload.role || 'authenticated');
  return response;
}

export const middleware = proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
};
