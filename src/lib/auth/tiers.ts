import { isUserAdmin } from './admin';

export type MembershipTier = 'FREE' | 'MEMBER';

export const PLUS_ROLE_ID = (process.env.DISCORD_REQUIRED_ROLE_ID || '1488271670119633047').trim();
export const PREMIUM_ROLE_ID = (process.env.DISCORD_PREMIUM_ROLE_ID || '1488346107351269526').trim();

/**
 * Check if user has active paid membership access.
 * Any member role (or admin) gives full access to all recorded sessions.
 */
export function hasMemberAccess(user: any): boolean {
  if (!user) return false;

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
  });

  if (isAdmin) return true;

  if (user.has_membership || user.user_metadata?.has_membership) {
    return true;
  }

  const roles: string[] =
    user.roles ||
    user.user_metadata?.roles ||
    user.user_metadata?.custom_claims?.roles ||
    [];

  return roles.includes(PLUS_ROLE_ID) || roles.includes(PREMIUM_ROLE_ID);
}

export function getMembershipTier(user: any): MembershipTier {
  return hasMemberAccess(user) ? 'MEMBER' : 'FREE';
}

export function canAccessTier(userTier: MembershipTier, _requiredTier?: string): boolean {
  return userTier === 'MEMBER';
}
