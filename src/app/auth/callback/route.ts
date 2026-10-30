import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient, createDbAdminClient } from '@/lib/db/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (host?.startsWith('localhost') || host?.startsWith('127.0.0.1') || host?.startsWith('192.168.') ? 'http' : 'https');
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const authError = searchParams.get('error');

  // Handle user cancellation or OAuth error
  if (authError || !code) {
    console.warn('[Auth Callback] Discord OAuth returned error or missing code:', authError || 'missing code');
    return NextResponse.redirect(`${origin}/?auth_error=true`);
  }

  // Parse state to retrieve original redirectTo target and origin
  let targetNext = searchParams.get('next') || '/';
  if (state) {
    try {
      const parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
      if (parsedState.redirectTo) {
        targetNext = parsedState.redirectTo;
      }
    } catch (e: any) {
      console.warn('[Auth Callback] Could not parse state parameter:', e.message);
    }
  }

  const dbServer = await createDbServerClient();
  if (!dbServer) {
    return NextResponse.redirect(`${origin}/?auth_error=true`);
  }

  // Use current origin to construct redirectUri for Discord token exchange
  const redirectUri = `${origin}/auth/callback`;
  const { data, error } = await dbServer.auth.exchangeCodeForSession(code, redirectUri);
  if (error || !data.session?.user) {
    console.error('[Auth Callback] Direct Discord code exchange failed:', error?.message);
    return NextResponse.redirect(`${origin}/?auth_error=true`);
  }

  const user = data.session.user;

  // Extract Discord user ID from session/identities
  const discordIdentity = user.identities?.find((i: any) => i.provider === 'discord');
  const discordUserId =
    (discordIdentity?.identity_data?.provider_id as string) ||
    (discordIdentity?.id as string) ||
    (user.user_metadata?.provider_id as string) ||
    (user.user_metadata?.sub as string) ||
    null;

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (discordUserId && botToken && guildId) {
    try {
      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      // If user is not in the guild (404 Unknown Member)
      if (memberRes.status === 404) {
        console.warn(`[Auth Callback] User ${discordUserId} is not in guild ${guildId}. Denying access.`);
        await dbServer.auth.signOut();
        return NextResponse.redirect(`${origin}/unauthorized?reason=not_in_guild`);
      }

      if (memberRes.ok) {
        const member = await memberRes.json();

        // Resolve display name: member.nick -> member.user.global_name -> member.user.username
        const resolvedServerName =
          member.nick ||
          member.user?.global_name ||
          member.user?.username ||
          user.user_metadata?.custom_claims?.global_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Member';

        // Avatar resolution
        let avatarUrl = user.user_metadata?.avatar_url || null;
        if (member.avatar) {
          avatarUrl = `https://cdn.discordapp.com/guilds/${guildId}/users/${discordUserId}/avatars/${member.avatar}.png`;
        } else if (member.user?.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${discordUserId}/${member.user.avatar}.png`;
        }

        const adminDb = await createDbAdminClient();
        const db = adminDb || dbServer;

        // Update or insert into public.profiles
        const { error: upsertErr } = await db.from('profiles').upsert(
          {
            id: user.id,
            email: user.email,
            display_name: resolvedServerName,
            server_display_name: resolvedServerName,
            discord_id: discordUserId,
            avatar_url: avatarUrl,
          },
          { onConflict: 'id' }
        );

        if (upsertErr && (upsertErr.code === '23505' || upsertErr.message?.includes('unique'))) {
          // If display_name collided with another user, append last 4 digits of discord id
          await db.from('profiles').upsert(
            {
              id: user.id,
              email: user.email,
              display_name: `${resolvedServerName}_${discordUserId.slice(-4)}`,
              server_display_name: resolvedServerName,
              discord_id: discordUserId,
              avatar_url: avatarUrl,
            },
            { onConflict: 'id' }
          );
        }
      }
    } catch (e: any) {
      console.error('[Auth Callback] Discord member lookup error:', e.message);
    }
  } else if (discordUserId) {
    // If bot token or guild ID not configured, save whatever Discord data is present
    const fallbackName =
      user.user_metadata?.custom_claims?.global_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Member';

    const adminDb = await createDbAdminClient();
    const db = adminDb || dbServer;

    await db.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        display_name: fallbackName,
        server_display_name: fallbackName,
        discord_id: discordUserId,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
      { onConflict: 'id' }
    );
  }

  // Create redirect response with local session cookies
  const targetUrl = targetNext.startsWith('http') ? targetNext : new URL(targetNext, origin).toString();
  const response = NextResponse.redirect(targetUrl);

  const isLocal =
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('192.168.');

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !isLocal,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  };

  const sessionToken = data.session.access_token;
  response.cookies.set('mv_session_token', sessionToken, cookieOptions);
  response.cookies.set('sb-access-token', sessionToken, cookieOptions);

  console.log(`[Auth Callback] Discord sign-in succeeded for user ${user.id}. Session cookies issued. Redirecting to ${targetUrl}`);
  return response;
}
