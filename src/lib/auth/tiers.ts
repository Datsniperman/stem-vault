import { isUserAdmin } from './admin';

export type MembershipTier = 'FREE' | 'PLUS' | 'PREMIUM';

export const PLUS_ROLE_ID = (process.env.DISCORD_REQUIRED_ROLE_ID || '1488271670119633047').trim();
export const PREMIUM_ROLE_ID = (process.env.DISCORD_PREMIUM_ROLE_ID || '1488346107351269526').trim();

/**
 * Resolve the user's membership tier from their verified token, DB profile, or Discord roles.
 */
export function getMembershipTier(user: any): MembershipTier {
  if (!user) return 'FREE';

  // Master admin check: admins always receive highest tier (PREMIUM)
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

  if (isAdmin) {
    return 'PREMIUM';
  }

  // Explicit tier field if already set
  const directTier = user.membershipTier || user.user_metadata?.membershipTier;
  if (directTier === 'PREMIUM') return 'PREMIUM';
  if (directTier === 'PLUS') return 'PLUS';

  // Check roles array in user or metadata
  const roles: string[] =
    user.roles ||
    user.user_metadata?.roles ||
    user.user_metadata?.custom_claims?.roles ||
    [];

  if (roles.includes(PREMIUM_ROLE_ID)) {
    return 'PREMIUM';
  }

  if (roles.includes(PLUS_ROLE_ID)) {
    return 'PLUS';
  }

  // Backward compatibility: check if has_membership flag is true
  if (user.has_membership || user.user_metadata?.has_membership) {
    return 'PLUS';
  }

  return 'FREE';
}

/**
 * Check whether a user's tier meets or exceeds the required tier.
 * Hierarchy: FREE < PLUS < PREMIUM
 */
export function canAccessTier(
  userTier: MembershipTier,
  requiredTier: 'PLUS' | 'PREMIUM'
): boolean {
  if (userTier === 'PREMIUM') return true;
  if (userTier === 'PLUS' && requiredTier === 'PLUS') return true;
  return false;
}
