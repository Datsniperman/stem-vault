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

export function isUserAdmin(params?: {
  email?: string | null;
  discordId?: string | null;
  username?: string | null;
  role?: string | null;
  userMetadata?: any;
}): boolean {
  if (!params) return false;
  const { email, discordId, username, role, userMetadata } = params;

  if (role === 'admin') return true;
  if (userMetadata?.role === 'admin') return true;
  if (userMetadata?.custom_claims?.role === 'admin') return true;

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
