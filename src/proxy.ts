import { NextResponse, type NextRequest } from 'next/server';
import { isUserAdmin } from './lib/auth/admin';

const JWT_SECRET =
  (process.env.JWT_SECRET || '').trim().replace(/^["']|["']$/g, '') ||
  'super-secret-jwt-token-with-at-least-32-characters-kerpbot-mixingvault';

const REQUIRED_MEMBERSHIP_ROLE_ID =
  (process.env.DISCORD_REQUIRED_ROLE_ID || '1488271670119633047').trim();

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

  // 3. Verify membership clearance: Must have required role OR be master admin
  const userMetadata = payload.user_metadata || {};
  const isAdmin =
    payload.role === 'admin' ||
    userMetadata.role === 'admin' ||
    userMetadata.custom_claims?.role === 'admin' ||
    isUserAdmin({
      email: payload.email,
      discordId: userMetadata.provider_id || payload.sub,
      username: userMetadata.display_name || userMetadata.server_display_name,
      role: payload.role,
      userMetadata,
    });

  const roles: string[] = Array.isArray(userMetadata.roles) ? userMetadata.roles : [];
  const hasMembershipRole = roles.includes(REQUIRED_MEMBERSHIP_ROLE_ID);
  const hasMembership = isAdmin || userMetadata.has_membership === true || hasMembershipRole;

  if (!hasMembership) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Forbidden: All Access Discord membership role required (Role ID: 1488271670119633047).',
          code: 'MEMBERSHIP_REQUIRED',
          membershipUrl: 'https://www.launchpass.com/all-access-by-tyler/membership',
        },
        { status: 403 }
      );
    }

    const membershipUrl = new URL('/membership', request.url);
    membershipUrl.searchParams.set('reason', 'missing_role');
    membershipUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(membershipUrl);
  }

  // 4. User is authorized
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
