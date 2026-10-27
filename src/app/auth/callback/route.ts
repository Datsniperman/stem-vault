import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=true`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/?auth_error=true`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session?.user) {
    console.error('[Auth Callback] Code exchange failed:', error?.message);
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
        await supabase.auth.signOut();
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

        const adminSupabase = await createSupabaseAdminClient();
        const db = adminSupabase || supabase;

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

    const adminSupabase = await createSupabaseAdminClient();
    const db = adminSupabase || supabase;

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

  return NextResponse.redirect(`${origin}${next}`);
}
