import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('192.168.');
  const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');

  let origin = host ? `${proto}://${host}` : request.nextUrl.origin;
  if (!isLocal && host.includes('mixingvault.com')) {
    origin = 'https://www.mixingvault.com';
  }

  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirectTo') || '/';

  const clientId = (process.env.DISCORD_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
  if (!clientId) {
    console.error('[Discord Auth] DISCORD_CLIENT_ID environment variable is missing.');
    return NextResponse.json(
      { message: 'DISCORD_CLIENT_ID is not configured on the server.' },
      { status: 500 }
    );
  }

  // Build OAuth2 redirect URI matching the canonical request origin
  const redirectUri = `${origin}/auth/callback`;

  // Encode state with return path and origin
  const statePayload = {
    redirectTo,
    origin,
    t: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const scopes = 'identify email guilds guilds.members.read';

  const discordUrl = new URL('https://discord.com/oauth2/authorize');
  discordUrl.searchParams.set('client_id', clientId);
  discordUrl.searchParams.set('response_type', 'code');
  discordUrl.searchParams.set('redirect_uri', redirectUri);
  discordUrl.searchParams.set('scope', scopes);
  discordUrl.searchParams.set('state', state);
  discordUrl.searchParams.set('prompt', 'consent');

  console.log(`[Discord Auth] Direct OAuth initiated -> origin: ${origin}, redirectUri: ${redirectUri}`);
  return NextResponse.redirect(discordUrl.toString());
}
