import { isUserAdmin } from './admin';

export type MembershipTier = 'FREE' | 'PLUS' | 'PREMIUM';

export const PLUS_ROLE_ID = (process.env.DISCORD_PLUS_ROLE_ID || process.env.DISCORD_REQUIRED_ROLE_ID || '1569410882822475837').trim();
export const PLUS_ROLE_IDS = ['1569410882822475837', '1488271670119633047'];
export const PREMIUM_ROLE_ID = (process.env.DISCORD_PREMIUM_ROLE_ID || '1488346107351269526').trim();
export const PRO_ROLE_ID = '1488346107351269526';
export const STAFF_ADMIN_ROLE_ID = (process.env.DISCORD_ADMIN_ROLE_ID || '1553858763474214912').trim();

/**
 * Check if user has active paid membership access (Plus or Premium or Admin).
 */
export function hasMemberAccess(user: any): boolean {
  if (!user) return false;

  const roles: string[] = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    ...(Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : []),
    ...(Array.isArray(user.user_metadata?.custom_claims?.roles) ? user.user_metadata.custom_claims.roles : []),
  ];

  const isAdmin = isUserAdmin({
    email: user.email,
    discordId:
      user.discord_id ||
      user.user_metadata?.discord_id ||
      user.user_metadata?.provider_id ||
      user.sub,
    username:
      user.user_metadata?.server_display_name ||
      user.user_metadata?.display_name ||
      user.display_name,
    role: user.role,
    userMetadata: user.user_metadata,
    roles,
  });

  if (isAdmin) return true;

  if (PLUS_ROLE_IDS.some(id => roles.includes(id)) || roles.includes(PREMIUM_ROLE_ID)) {
    return true;
  }

  if (user.has_membership || user.user_metadata?.has_membership) {
    return true;
  }

  return false;
}

/**
 * Resolve the user's specific membership tier: 'FREE' | 'PLUS' | 'PREMIUM'
 */
export function getMembershipTier(user: any): MembershipTier {
  if (!user) return 'FREE';

  const roles: string[] = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    ...(Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : []),
    ...(Array.isArray(user.user_metadata?.custom_claims?.roles) ? user.user_metadata.custom_claims.roles : []),
  ];

  const isAdmin = isUserAdmin({
    email: user.email,
    discordId:
      user.discord_id ||
      user.user_metadata?.discord_id ||
      user.user_metadata?.provider_id ||
      user.sub,
    username:
      user.user_metadata?.server_display_name ||
      user.user_metadata?.display_name ||
      user.display_name,
    role: user.role,
    userMetadata: user.user_metadata,
    roles,
  });

  if (isAdmin) return 'PREMIUM';

  if (roles.includes(PREMIUM_ROLE_ID) || roles.includes(PRO_ROLE_ID)) {
    return 'PREMIUM';
  }

  if (PLUS_ROLE_IDS.some(id => roles.includes(id)) || user.has_membership || user.user_metadata?.has_membership) {
    return 'PLUS';
  }

  return 'FREE';
}

/**
 * Check whether a user can access Pro Multitracks (Premium Tier and Admin only).
 */
export function canAccessProMultitracks(user: any): boolean {
  return getMembershipTier(user) === 'PREMIUM';
}

/**
 * Check whether a user can submit for Sunday Mix Review (Premium Tier and Admin only).
 */
export function canSubmitSundayReview(user: any): boolean {
  return getMembershipTier(user) === 'PREMIUM';
}

/**
 * Check whether an uploader is a pro user with Discord role '1488346107351269526'
 * (uploads automatically become Pro Multitracks).
 */
export async function isProUserUploader(user: any): Promise<boolean> {
  if (!user) return false;

  const roles: string[] = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    ...(Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : []),
    ...(Array.isArray(user.user_metadata?.custom_claims?.roles) ? user.user_metadata.custom_claims.roles : []),
  ];

  if (roles.includes(PRO_ROLE_ID) || roles.includes(PREMIUM_ROLE_ID)) {
    return true;
  }

  const discordId =
    user.discord_id ||
    user.user_metadata?.discord_id ||
    user.user_metadata?.provider_id ||
    (user.identities && user.identities[0]?.id) ||
    (user.user_metadata?.sub && String(user.user_metadata.sub).length > 15 ? user.user_metadata.sub : null);

  if (discordId === '1377286620344221778' || discordId === '635718336822378506') {
    return true;
  }

  if (discordId && process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`,
        {
          headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
          cache: 'no-store',
        }
      );
      if (res.ok) {
        const memberData = await res.json();
        const liveRoles: string[] = Array.isArray(memberData.roles) ? memberData.roles : [];
        if (liveRoles.includes(PRO_ROLE_ID) || liveRoles.includes(PREMIUM_ROLE_ID)) {
          return true;
        }
      }
    } catch (e: any) {
      console.warn('[isProUserUploader] Error checking Discord roles:', e?.message);
    }
  }

  return false;
}
