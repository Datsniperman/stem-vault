export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  role?: string;
  created_at?: string;
  confirmed_at?: string;
  identities?: any[];
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user: User;
}

export type AuthChangeEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'USER_UPDATED'
  | 'TOKEN_REFRESHED'
  | 'INITIAL_SESSION';

export interface DbResult<T = any> {
  data: T | null;
  error: { message: string; code?: string; details?: any } | null;
  count?: number | null;
}
