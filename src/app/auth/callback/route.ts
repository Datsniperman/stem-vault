import { isUserAdmin } from '@/lib/auth/admin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDbServerClient, createDbAdminClient } from '@/lib/db/server';
import { createUserToken } from '@/lib/db/jwt';

export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('192.168.');
  const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
  let origin = host ? `${proto}://${host}` : request.nextUrl.origin;
  if (!isLocal && host.includes('mixingvault.com')) {
    origin = 'https://www.mixingvault.com';
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const authError = searchParams.get('error');

  // Handle user cancellation or OAuth error
  if (authError || !code) {
    const msg = authError ? `Discord returned: ${authError}` : 'No authorization code received from Discord';
    console.warn('[Auth Callback] Discord OAuth error:', msg);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(msg)}`);
  }

  // Parse state to retrieve original redirectTo target and origin
  let targetNext = searchParams.get('next') || '/';
  let exchangeOrigin = origin;
  if (state) {
    try {
      const parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
      if (parsedState.redirectTo) {
        targetNext = parsedState.redirectTo;
      }
      if (parsedState.origin) {
        exchangeOrigin = parsedState.origin;
      }
    } catch (e: any) {
      console.warn('[Auth Callback] Could not parse state parameter:', e.message);
    }
  }

  const dbServer = await createDbServerClient();
  if (!dbServer) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent('Database server client failed to initialize')}`);
  }

  // Use exchangeOrigin matching what was sent to Discord
  const redirectUri = `${exchangeOrigin}/auth/callback`;
  const { data, error } = await dbServer.auth.exchangeCodeForSession(code, redirectUri);
  if (error || !data.session?.user) {
    const msg = error?.message || 'Session exchange failed';
    console.error('[Auth Callback] Direct Discord code exchange failed:', msg);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(msg)}`);
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

  const botToken = (process.env.DISCORD_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  const guildId = (process.env.DISCORD_GUILD_ID || '').trim().replace(/^["']|["']$/g, '');

  let isGuildAdmin = false;
  let resolvedServerName =
    user.user_metadata?.custom_claims?.global_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Member';
  let avatarUrl: string | null = user.user_metadata?.avatar_url || null;

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
        const isMasterAdmin = isUserAdmin({
          email: user.email,
          discordId: discordUserId,
        });
        if (!isMasterAdmin) {
          console.warn(`[Auth Callback] User ${discordUserId} is not in guild ${guildId}. Denying access.`);
          await dbServer.auth.signOut();
          return NextResponse.redirect(`${origin}/unauthorized?reason=not_in_guild`);
        }
      }

      if (memberRes.ok) {
        const member = await memberRes.json();

        // Check Discord administrator permission bit 0x8
        try {
          if (member.permissions && (BigInt(member.permissions) & BigInt(8)) === BigInt(8)) {
            isGuildAdmin = true;
          }
        } catch {}

        // Check Discord server owner
        try {
          const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
            headers: { Authorization: `Bot ${botToken}` },
          });
          if (guildRes.ok) {
            const guildData = await guildRes.json();
            if (guildData.owner_id === discordUserId) {
              isGuildAdmin = true;
            }
          }
        } catch {}

        // Resolve display name: member.nick -> member.user.global_name -> member.user.username
        resolvedServerName =
          member.nick ||
          member.user?.global_name ||
          member.user?.username ||
          resolvedServerName;

        // Avatar resolution
        if (member.avatar) {
          avatarUrl = `https://cdn.discordapp.com/guilds/${guildId}/users/${discordUserId}/avatars/${member.avatar}.png`;
        } else if (member.user?.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${discordUserId}/${member.user.avatar}.png`;
        }
      }
    } catch (e: any) {
      console.error('[Auth Callback] Discord member lookup error:', e.message);
    }
  }

  // Calculate admin privilege universally
  const isAdmin = isGuildAdmin || isUserAdmin({
    email: user.email,
    discordId: discordUserId,
    username: resolvedServerName,
    role: user.role,
    userMetadata: user.user_metadata,
  });

  const calculatedRole = isAdmin ? 'admin' : (user.user_metadata?.role || 'user');

  if (isAdmin) {
    user.role = 'admin';
    user.user_metadata = {
      ...user.user_metadata,
      role: 'admin',
      custom_claims: { ...(user.user_metadata?.custom_claims || {}), role: 'admin' },
    };
    data.session.access_token = createUserToken(user);
  }

  if (discordUserId) {
    try {
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
          role: calculatedRole,
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
            role: calculatedRole,
          },
          { onConflict: 'id' }
        );
      }
    } catch (dbErr: any) {
      console.warn('[Auth Callback] Profile upsert skipped:', dbErr?.message);
    }
  }

  // Create redirect response with local session cookies
  const targetUrl = targetNext.startsWith('http') ? targetNext : new URL(targetNext, origin).toString();
  const response = NextResponse.redirect(targetUrl);

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

  const sessionToken = data.session.access_token;

  try {
    const cookieStore = await cookies();
    cookieStore.set('mv_session_token', sessionToken, cookieOptions);
    cookieStore.set('sb-access-token', sessionToken, cookieOptions);
  } catch (err: any) {
    console.warn('[Auth Callback] Could not set cookies via cookieStore:', err?.message);
  }

  response.cookies.set('mv_session_token', sessionToken, cookieOptions);
  response.cookies.set('sb-access-token', sessionToken, cookieOptions);

  console.log(`[Auth Callback] Discord sign-in succeeded for user ${user.id} (role: ${user.role}). Redirecting to ${targetUrl}`);
  return response;
}
