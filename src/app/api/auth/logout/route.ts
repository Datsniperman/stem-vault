import { NextRequest, NextResponse } from 'next/server';

function handleLogout(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('192.168.');
  const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;

  const cookieDomain = (!isLocal && host && host.includes('mixingvault.com')) ? '.mixingvault.com' : undefined;

  const cookieOptions: any = {
    httpOnly: true,
    secure: !isLocal,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  if (cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }

  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get('redirect') || searchParams.get('returnTo');

  const response = redirectPath
    ? NextResponse.redirect(new URL(redirectPath, origin))
    : NextResponse.json({ success: true });

  response.cookies.set('mv_session_token', '', cookieOptions);
  response.cookies.set('sb-access-token', '', cookieOptions);

  return response;
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}
