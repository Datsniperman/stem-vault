import jwt from 'jsonwebtoken';
import { User } from './types';

export const JWT_SECRET =
  (process.env.JWT_SECRET || '').trim().replace(/^["']|["']$/g, '') ||
  'super-secret-jwt-token-with-at-least-32-characters-kerpbot-mixingvault';

export function signJwt(payload: Record<string, any>, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export function createAnonToken(): string {
  return signJwt({ role: 'anon', iss: 'local-auth' }, '30d');
}

export function createServiceToken(): string {
  return signJwt({ role: 'service_role', iss: 'local-auth' }, '30d');
}

export function createUserToken(user: User): string {
  const role = user.role === 'admin' ? 'admin' : (user.role || 'authenticated');
  const discordId =
    (user.user_metadata?.discord_id as string) ||
    (user.user_metadata?.provider_id as string) ||
    (user.identities?.find((i: any) => i.provider === 'discord')?.id as string) ||
    (user.identities?.find((i: any) => i.provider === 'discord')?.identity_data?.provider_id as string) ||
    null;

  return signJwt(
    {
      sub: user.id,
      email: user.email,
      discord_id: discordId,
      role,
      aud: 'authenticated',
      iss: 'local-auth',
      user_metadata: {
        ...(user.user_metadata || {}),
        discord_id: discordId,
        role,
      },
    },
    '7d'
  );
}
