export const ADMIN_EMAILS = [
  'connorwbrown07@gmail.com',
  'connorwbrown2007@gmail.com',
];

export const ADMIN_DISCORD_IDS = [
  '725867136232456302', // Connor (datsniperman)
];

export const ADMIN_USERNAMES = [
  'datsniperman',
];

export const ADMIN_DISCORD_ROLE_IDS = [
  '1553858763474214912',
];

export function isUserAdmin(params?: {
  email?: string | null;
  discordId?: string | null;
  username?: string | null;
  role?: string | null;
  userMetadata?: any;
  roles?: string[] | null;
}): boolean {
  if (!params) return false;
  const { email, discordId, username, role, userMetadata, roles } = params;

  if (role === 'admin') return true;
  if (userMetadata?.role === 'admin') return true;
  if (userMetadata?.custom_claims?.role === 'admin') return true;

  // Check Discord role ID '1553858763474214912'
  const extractedRoles: string[] = [
    ...(Array.isArray(roles) ? roles : []),
    ...(Array.isArray(userMetadata?.roles) ? userMetadata.roles : []),
    ...(Array.isArray(userMetadata?.custom_claims?.roles) ? userMetadata.custom_claims.roles : []),
  ];
  if (extractedRoles.some(r => ADMIN_DISCORD_ROLE_IDS.includes(String(r).trim()))) {
    return true;
  }
  if (process.env.ADMIN_DISCORD_ROLE_IDS) {
    const list = process.env.ADMIN_DISCORD_ROLE_IDS.split(',').map(r => r.trim());
    if (extractedRoles.some(r => list.includes(String(r).trim()))) {
      return true;
    }
  }

  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    if (ADMIN_EMAILS.includes(cleanEmail)) return true;
    if (process.env.ADMIN_EMAILS) {
      const list = process.env.ADMIN_EMAILS.split(',').map(e => e.toLowerCase().trim());
      if (list.includes(cleanEmail)) return true;
    }
  }

  if (discordId) {
    const cleanId = String(discordId).trim();
    if (ADMIN_DISCORD_IDS.includes(cleanId)) return true;
    if (process.env.ADMIN_DISCORD_IDS) {
      const list = process.env.ADMIN_DISCORD_IDS.split(',').map(d => d.trim());
      if (list.includes(cleanId)) return true;
    }
  }

  if (username) {
    const cleanUsername = username.toLowerCase().trim();
    if (ADMIN_USERNAMES.includes(cleanUsername)) return true;
  }

  return false;
}
