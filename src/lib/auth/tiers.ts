import { isUserAdmin } from './admin';

export type MembershipTier = 'FREE' | 'PLUS' | 'PREMIUM';

export const PLUS_ROLE_ID = (process.env.DISCORD_REQUIRED_ROLE_ID || '1488271670119633047').trim();
export const PREMIUM_ROLE_ID = (process.env.DISCORD_PREMIUM_ROLE_ID || '1488346107351269526').trim();

/**
 * Check if user has active paid membership access (Plus or Premium or Admin).
 */
export function hasMemberAccess(user: any): boolean {
  if (!user) return false;

  const roles: string[] =
    user.roles ||
    user.user_metadata?.roles ||
    user.user_metadata?.custom_claims?.roles ||
    [];

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

  if (roles.includes(PLUS_ROLE_ID) || roles.includes(PREMIUM_ROLE_ID)) {
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

  const roles: string[] =
    user.roles ||
    user.user_metadata?.roles ||
    user.user_metadata?.custom_claims?.roles ||
    [];

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

  if (roles.includes(PREMIUM_ROLE_ID)) {
    return 'PREMIUM';
  }

  if (roles.includes(PLUS_ROLE_ID) || user.has_membership || user.user_metadata?.has_membership) {
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
