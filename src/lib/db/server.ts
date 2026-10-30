import { cookies } from 'next/headers';
import { QueryBuilder } from './queryBuilder';
import { User, Session, DbResult } from './types';
import { verifyJwt, createAnonToken, createServiceToken, createUserToken } from './jwt';
import { getDbPool } from './pool';

const POSTGREST_URL =
  process.env.POSTGREST_URL ||
  'http://127.0.0.1:5430';

export class LocalServerClient {
  private token: string;
  private user: User | null;

  constructor(token: string, user: User | null) {
    this.token = token;
    this.user = user;
  }

  from(table: string): QueryBuilder {
    return new QueryBuilder(table, {
      baseUrl: POSTGREST_URL,
      authToken: this.token,
    });
  }

  async rpc(functionName: string, args: Record<string, any> = {}): Promise<DbResult<any>> {
    try {
      const url = `${POSTGREST_URL}/rpc/${functionName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(args),
      });

      if (!response.ok) {
        let errBody: any;
        try {
          errBody = await response.json();
        } catch {
          errBody = { message: await response.text() };
        }
        return {
          data: null,
          error: {
            message: errBody?.message || `RPC ${functionName} failed with status ${response.status}`,
            code: errBody?.code || String(response.status),
          },
        };
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      return { data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { message: err?.message || `RPC ${functionName} error` },
      };
    }
  }

  get auth() {
    return {
      getUser: async (customToken?: string): Promise<{ data: { user: User | null }; error: any }> => {
        if (customToken) {
          const payload = verifyJwt<any>(customToken);
          if (payload && payload.sub) {
            const user: User = {
              id: payload.sub,
              email: payload.email,
              role: payload.role || 'authenticated',
              user_metadata: payload.user_metadata || {},
            };
            return { data: { user }, error: null };
          }
          return { data: { user: null }, error: { message: 'Invalid token' } };
        }
        return { data: { user: this.user }, error: null };
      },

      signOut: async (_options?: any): Promise<{ error: any }> => {
        try {
          const cookieStore = await cookies();
          cookieStore.delete('mv_session_token');
          cookieStore.delete('sb-access-token');
        } catch {}
        return { error: null };
      },

      exchangeCodeForSession: async (
        code: string,
        customRedirectUri?: string
      ): Promise<{ data: { session: Session | null }; error: any }> => {
        try {
          const clientId = process.env.DISCORD_CLIENT_ID;
          const clientSecret = process.env.DISCORD_CLIENT_SECRET;
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          const redirectUri = customRedirectUri || `${siteUrl}/auth/callback`;

          if (!clientId || !clientSecret) {
            return { data: { session: null }, error: { message: 'Discord OAuth credentials missing' } };
          }

          const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUri,
            }),
          });

          if (!tokenRes.ok) {
            return { data: { session: null }, error: { message: 'Failed to exchange Discord code' } };
          }

          const tokenData = await tokenRes.json();
          const userRes = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });

          if (!userRes.ok) {
            return { data: { session: null }, error: { message: 'Failed to fetch Discord user' } };
          }

          const discordUser = await userRes.json();
          const pool = getDbPool();

          // Check if identity/profile exists for discordUser.id
          const profileRes = await pool.query(
            `SELECT id, email, display_name FROM public.profiles WHERE discord_id = $1 LIMIT 1`,
            [discordUser.id]
          );

          let userId: string;
          let email: string = discordUser.email || `${discordUser.username}@discord.kerpbot`;

          if (profileRes.rows.length > 0) {
            userId = profileRes.rows[0].id;
          } else {
            // Find or insert in auth.users
            const userCheck = await pool.query(
              `SELECT id FROM auth.users WHERE lower(email) = lower($1) LIMIT 1`,
              [email]
            );
            if (userCheck.rows.length > 0) {
              userId = userCheck.rows[0].id;
            } else {
              userId = (await import('crypto')).randomUUID();
              await pool.query(
                `INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, role, aud, created_at, updated_at)
                 VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, $3, 'authenticated', 'authenticated', now(), now())`,
                [userId, email, JSON.stringify({ display_name: discordUser.global_name || discordUser.username })]
              );
            }
          }

          const resolvedUser: User = {
            id: userId,
            email,
            role: 'authenticated',
            user_metadata: {
              provider_id: discordUser.id,
              custom_claims: { global_name: discordUser.global_name || discordUser.username },
              avatar_url: discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                : null,
            },
            identities: [{ provider: 'discord', id: discordUser.id, identity_data: { provider_id: discordUser.id } }],
          };

          const jwtToken = createUserToken(resolvedUser);
          const session: Session = {
            access_token: jwtToken,
            token_type: 'bearer',
            expires_in: 7 * 24 * 60 * 60,
            user: resolvedUser,
          };

          return { data: { session }, error: null };
        } catch (err: any) {
          return { data: { session: null }, error: { message: err?.message || 'OAuth error' } };
        }
      },
    };
  }
}

export async function createDbServerClient(): Promise<LocalServerClient> {
  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get('mv_session_token')?.value ||
    cookieStore.get('sb-access-token')?.value ||
    '';

  let user: User | null = null;
  let token = createAnonToken();

  if (sessionCookie) {
    const payload = verifyJwt<any>(sessionCookie);
    if (payload && payload.sub) {
      user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role || 'authenticated',
        user_metadata: payload.user_metadata || {},
      };
      token = sessionCookie;
    }
  }

  return new LocalServerClient(token, user);
}

export async function createDbAdminClient(): Promise<LocalServerClient> {
  const serviceToken = createServiceToken();
  return new LocalServerClient(serviceToken, {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'admin@mixingvault.local',
    role: 'service_role',
  });
}
