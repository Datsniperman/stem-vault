import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const botToken = process.env.DISCORD_BOT_TOKEN || 'dummy_token_for_build';
const rest = new REST({ version: '10' }).setToken(botToken);

export const GUILD_ID = process.env.DISCORD_GUILD_ID || '';
export const MULTITRACK_CHANNEL_ID = process.env.DISCORD_MULTITRACKS_CHANNEL_ID || '';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stem-vault-tau.vercel.app';

export interface StemAnnouncementPayload {
  stemId: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string | null;
  trackCount: number | null;
  downloadUrl: string;
  dawTemplateUrl?: string | null;
  uploaderHandle: string;
}

export async function announceMultitrack(payload: StemAnnouncementPayload): Promise<{
  messageId: string | null;
  threadId: string | null;
}> {
  if (!process.env.DISCORD_BOT_TOKEN || !MULTITRACK_CHANNEL_ID) {
    console.warn('[Discord] Bot token or multitracks channel ID not set. Skipping Discord announcement.');
    return { messageId: null, threadId: null };
  }

  try {
    const actionButtons: any[] = [
      {
        type: 2, // Button
        style: 5, // Link
        label: 'Download Stems',
        url: payload.downloadUrl,
      },
    ];

    if (payload.dawTemplateUrl) {
      actionButtons.push({
        type: 2,
        style: 5,
        label: 'DAW Template',
        url: payload.dawTemplateUrl,
      });
    }

    actionButtons.push({
      type: 2,
      style: 5,
      label: 'Submit Your Mix',
      url: `${SITE_URL}/stems/${payload.stemId}?action=submit`,
    });

    const fields = [
      { name: 'Key', value: payload.key || 'N/A', inline: true },
      { name: 'BPM', value: payload.bpm ? `${payload.bpm}` : 'N/A', inline: true },
      { name: 'Track Count', value: payload.trackCount ? `${payload.trackCount} Channels` : 'N/A', inline: true },
    ];

    if (payload.dawTemplateUrl) {
      fields.push({
        name: 'DAW Template',
        value: `[Download Template](${payload.dawTemplateUrl})`,
        inline: true,
      });
    }

    // 1. Post Embed with Link Buttons
    const message = (await rest.post(Routes.channelMessages(MULTITRACK_CHANNEL_ID), {
      body: {
        embeds: [
          {
            title: `🎛️ New Multitrack Pack: ${payload.title}`,
            description: `Artist: **${payload.artist}**\nUploaded by: **${payload.uploaderHandle}**`,
            color: 0x00ffaa, // Brand accent color
            fields,
            footer: { text: 'The Mixing Vault • Download stems and post your mix for feedback!' },
          },
        ],
        components: [
          {
            type: 1, // ActionRow
            components: actionButtons,
          },
        ],
      },
    })) as { id: string };

    // 2. Start a Public Feedback Thread under that announcement
    const thread = (await rest.post(Routes.threads(MULTITRACK_CHANNEL_ID, message.id), {
      body: {
        name: `💬 Mix Feedback: ${payload.title}`,
        auto_archive_duration: 10080, // 7 days
      },
    })) as { id: string };

    // 3. Post a Welcome/Instruction message inside the new thread
    await rest.post(Routes.channelMessages(thread.id), {
      body: {
        content: `Welcome to the feedback thread for **${payload.title}**! 🎧\nWhen members submit a mix on the site, their mix details and cloud links will automatically drop here. Reply directly to any mix to share feedback, time-stamped tips, and EQ/balance advice!`,
      },
    });

    return {
      messageId: message.id,
      threadId: thread.id,
    };
  } catch (error: any) {
    console.error('[Discord] Error in announceMultitrack:', error);
    return { messageId: null, threadId: null };
  }
}

export async function postMixToThread(
  threadId: string,
  mix: {
    songName: string;
    artist: string;
    key: string;
    bpm: number;
    mixUrl: string;
    notes?: string;
    submitterHandle: string;
    discordId?: string;
  }
): Promise<string | null> {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('[Discord] Bot token not set. Skipping mix thread post.');
    return null;
  }

  const engineerMention = mix.discordId ? `<@${mix.discordId}>` : mix.submitterHandle;

  // Unarchive thread if Discord automatically closed it
  try {
    await rest.patch(Routes.channel(threadId), { body: { archived: false } });
  } catch {
    // Ignore if already active
  }

  try {
    const post = (await rest.post(Routes.channelMessages(threadId), {
      body: {
        content: `🚨 **New Mix Submitted by ${engineerMention}!**`,
        embeds: [
          {
            title: `Mix: ${mix.songName}`,
            description: mix.artist ? `Original Artist: **${mix.artist}**` : undefined,
            color: 0x5865f2,
            fields: [
              { name: 'Musical Key', value: mix.key, inline: true },
              { name: 'BPM', value: `${mix.bpm}`, inline: true },
              { name: 'Mix Link (Drive/Dropbox)', value: `[Listen to Mix](${mix.mixUrl})`, inline: false },
              ...(mix.notes ? [{ name: 'Mix Notes & Gear', value: mix.notes, inline: false }] : []),
            ],
            footer: { text: 'Reply to this message with time-stamped critiques and tips!' },
          },
        ],
      },
    })) as { id: string };

    return post.id;
  } catch (error: any) {
    console.error('[Discord] Error in postMixToThread:', error);
    return null;
  }
}

export async function fetchGuildMember(discordUserId: string) {
  if (!process.env.DISCORD_BOT_TOKEN || !GUILD_ID) {
    return null;
  }

  try {
    const member = (await rest.get(Routes.guildMember(GUILD_ID, discordUserId))) as any;
    return member;
  } catch (error: any) {
    if (error.status === 404 || error.code === 10007) {
      // 10007 = Unknown Member
      return 404;
    }
    console.error('[Discord] Error fetching guild member:', error);
    return null;
  }
}
