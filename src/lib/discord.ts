import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const botToken = process.env.DISCORD_BOT_TOKEN || 'dummy_token_for_build';
const rest = new REST({ version: '10' }).setToken(botToken);

export const GUILD_ID = process.env.DISCORD_GUILD_ID || '';
export const MULTITRACK_CHANNEL_ID = process.env.DISCORD_MULTITRACKS_CHANNEL_ID || '1565366257996275847';
export const MIXES_CHANNEL_ID = process.env.DISCORD_MIXES_CHANNEL_ID || '1488267886605766878';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mixingvault.com';

export interface StemAnnouncementPayload {
  stemId: string;
  title: string;
  artist?: string;
  bpm?: number | null;
  key?: string | null;
  trackCount?: number | null;
  totalSize?: string | null;
  tracksPreview?: string | null;
  downloadUrl: string;
  dawTemplateUrl?: string | null;
  uploaderHandle: string;
  discordId?: string | null;
}

export async function announceMultitrack(payload: StemAnnouncementPayload): Promise<{
  messageId: string | null;
  threadId: string | null;
}> {
  const channelId = process.env.DISCORD_MULTITRACKS_CHANNEL_ID || MULTITRACK_CHANNEL_ID || '1565366257996275847';
  if (!process.env.DISCORD_BOT_TOKEN || !channelId) {
    console.warn('[Discord] Bot token or multitracks channel ID not set. Skipping Discord announcement.');
    return { messageId: null, threadId: null };
  }

  const engineerMention = payload.discordId ? `<@${payload.discordId}>` : `**${payload.uploaderHandle}**`;

  try {
    const actionButtons: any[] = [
      {
        type: 2, // Button
        style: 5, // Link
        label: 'Open in Mixing Vault',
        url: payload.downloadUrl,
      },
      {
        type: 2,
        style: 5,
        label: 'Submit Your Mix',
        url: `${SITE_URL}/mixes?multi_id=${payload.stemId}`,
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

    const fields: any[] = [];
    if (payload.trackCount) {
      fields.push({ name: 'Channels', value: `${payload.trackCount} Tracks`, inline: true });
    }
    if (payload.totalSize) {
      fields.push({ name: 'Archive Size', value: payload.totalSize, inline: true });
    }
    if (payload.key) {
      fields.push({ name: 'Key', value: payload.key, inline: true });
    }
    if (payload.bpm) {
      fields.push({ name: 'BPM', value: String(payload.bpm), inline: true });
    }
    if (payload.tracksPreview) {
      fields.push({ name: 'Included Stems', value: payload.tracksPreview, inline: false });
    }

    // 1. Post Embed with Link Buttons to multitrack-releases channel (1565366257996275847)
    const message = (await rest.post(Routes.channelMessages(channelId), {
      body: {
        content: `🚨 **New Multitrack Drop by ${engineerMention}!**`,
        embeds: [
          {
            title: `🎛️ Multitrack Pack: ${payload.title}`,
            description: `Uploaded by: ${engineerMention}\nAll isolated stems are uploaded and ready to download or audition on The Mixing Vault!`,
            color: 0x00ffaa,
            fields,
            footer: { text: 'The Mixing Vault • Download stems and post your mix for feedback!' },
          },
        ],
        components: [
          {
            type: 1,
            components: actionButtons,
          },
        ],
      },
    })) as { id: string };

    // 2. Start a Public Feedback Thread under that announcement
    const thread = (await rest.post(Routes.threads(channelId, message.id), {
      body: {
        name: `💬 Mix Feedback: ${payload.title}`,
        auto_archive_duration: 10080, // 7 days
      },
    })) as { id: string };

    // 3. Post a Welcome/Instruction message inside the new thread
    await rest.post(Routes.channelMessages(thread.id), {
      body: {
        content: `Welcome to the feedback thread for **${payload.title}**! 🎧\nWhen members submit a mix on the site, their mix details and audio will drop here. Reply directly to any mix to share feedback and time-stamped tips!`,
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

export interface MixAnnouncementPayload {
  mixId: string;
  title: string;
  format: string;
  publicUrl: string;
  uploaderName: string;
  discordId?: string | null;
  multiTitle?: string | null;
  threadId?: string | null;
}

export async function announceMix(payload: MixAnnouncementPayload): Promise<string | null> {
  const channelId = process.env.DISCORD_MIXES_CHANNEL_ID || MIXES_CHANNEL_ID || '1488267886605766878';
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('[Discord] Bot token not set. Skipping mix announcement.');
    return null;
  }

  const engineerMention = payload.discordId ? `<@${payload.discordId}>` : `**${payload.uploaderName}**`;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mixingvault.com').replace(/\/+$/, '');

  const targetChannelOrThread = payload.threadId || channelId;

  // If posting to a thread, ensure it's not archived
  if (payload.threadId) {
    try {
      await rest.patch(Routes.channel(payload.threadId), { body: { archived: false } });
    } catch {}
  }

  try {
    const actionButtons: any[] = [
      {
        type: 2,
        style: 5,
        label: 'Listen on Vault',
        url: `${siteUrl}/mixes`,
      },
      {
        type: 2,
        style: 5,
        label: 'Direct Audio Stream',
        url: payload.publicUrl,
      },
    ];

    const fields: any[] = [
      { name: 'Format', value: payload.format || 'WAV', inline: true },
    ];
    if (payload.multiTitle) {
      fields.push({ name: 'Multitrack Song', value: payload.multiTitle, inline: true });
    }

    const message = (await rest.post(Routes.channelMessages(targetChannelOrThread), {
      body: {
        content: `🚨 **New Mix Uploaded by ${engineerMention}!**`,
        embeds: [
          {
            title: `🎧 Mix: ${payload.title}`,
            description: payload.multiTitle
              ? `Song: **${payload.multiTitle}**\nUploaded by: ${engineerMention}`
              : `Uploaded by: ${engineerMention}`,
            color: 0x5865f2,
            fields,
            footer: { text: 'The Mixing Vault • Listen and leave your critique!' },
          },
        ],
        components: [
          {
            type: 1,
            components: actionButtons,
          },
        ],
      },
    })) as { id: string };

    return message.id;
  } catch (error: any) {
    console.error('[Discord] Error in announceMix:', error);
    return null;
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
  } catch {}

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
      return 404;
    }
    console.error('[Discord] Error fetching guild member:', error);
    return null;
  }
}
