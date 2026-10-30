import { User, Session, AuthChangeEvent } from './types';

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

class AuthEventEmitter {
  private listeners: Set<AuthListener> = new Set();

  subscribe(listener: AuthListener): { unsubscribe: () => void } {
    this.listeners.add(listener);
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  notify(event: AuthChangeEvent, session: Session | null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (e) {
        console.error('[AuthEventEmitter] Listener error:', e);
      }
    });
  }
}

export const authEmitter = new AuthEventEmitter();

export class BrowserAuth {
  private cachedSession: Session | null = null;

  async getSession(): Promise<{ data: { session: Session | null }; error: any }> {
    if (this.cachedSession) {
      return { data: { session: this.cachedSession }, error: null };
    }

    try {
      if (typeof window === 'undefined') {
        return { data: { session: null }, error: null };
      }

      // Check localStorage first
      const stored = localStorage.getItem('mixingvault_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.cachedSession = parsed;
          return { data: { session: parsed }, error: null };
        } catch {}
      }

      // Query /api/auth/me
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const body = await res.json();
        if (body?.session) {
          this.cachedSession = body.session;
          try {
            localStorage.setItem('mixingvault_session', JSON.stringify(body.session));
          } catch {}
          return { data: { session: body.session }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    } catch (err: any) {
      return { data: { session: null }, error: { message: err?.message } };
    }
  }

  async getUser(): Promise<{ data: { user: User | null }; error: any }> {
    const { data, error } = await this.getSession();
    return { data: { user: data.session?.user || null }, error };
  }

  async setSession(session: { access_token: string; refresh_token?: string }): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const body = await res.json();
          if (body?.session) {
            this.cachedSession = body.session;
            localStorage.setItem('mixingvault_session', JSON.stringify(body.session));
            authEmitter.notify('TOKEN_REFRESHED', body.session);
          }
        }
      } catch {}
    }
  }

  onAuthStateChange(callback: AuthListener): { data: { subscription: { unsubscribe: () => void } } } {
    const subscription = authEmitter.subscribe(callback);
    return { data: { subscription } };
  }

  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ data: { user: User | null; session: Session | null }; error: any }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const body = await res.json();
      if (!res.ok) {
        return { data: { user: null, session: null }, error: { message: body.message || 'Login failed' } };
      }

      this.cachedSession = body.session;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mixingvault_session', JSON.stringify(body.session));
      }
      authEmitter.notify('SIGNED_IN', body.session);

      return { data: { user: body.session.user, session: body.session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err?.message || 'Login request error' } };
    }
  }

  async signUp(credentials: {
    email: string;
    password: string;
    options?: {
      data?: { display_name?: string };
      emailRedirectTo?: string;
    };
  }): Promise<{ data: { user: User | null; session: Session | null }; error: any }> {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          displayName: credentials.options?.data?.display_name,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        return { data: { user: null, session: null }, error: { message: body.message || 'Sign up failed' } };
      }

      this.cachedSession = body.session;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mixingvault_session', JSON.stringify(body.session));
      }
      authEmitter.notify('SIGNED_IN', body.session);

      return { data: { user: body.session.user, session: body.session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err?.message || 'Sign up request error' } };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    this.cachedSession = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mixingvault_session');
    }
    authEmitter.notify('SIGNED_OUT', null);

    return { error: null };
  }

  async updateUser(attributes: {
    password?: string;
    data?: Record<string, any>;
  }): Promise<{ data: { user: User | null }; error: any }> {
    try {
      const res = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributes),
      });

      const body = await res.json();
      if (!res.ok) {
        return { data: { user: null }, error: { message: body.message || 'Update failed' } };
      }

      if (this.cachedSession) {
        this.cachedSession.user = body.user;
        if (typeof window !== 'undefined') {
          localStorage.setItem('mixingvault_session', JSON.stringify(this.cachedSession));
        }
      }
      authEmitter.notify('USER_UPDATED', this.cachedSession);

      return { data: { user: body.user }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: { message: err?.message || 'Update error' } };
    }
  }

  async resetPasswordForEmail(
    email: string,
    options?: { redirectTo?: string }
  ): Promise<{ data: any; error: any }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: options?.redirectTo }),
      });
      const body = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: body.message || 'Failed to send reset email' } };
      }
      return { data: body, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || 'Password reset request error' } };
    }
  }

  async signInWithOAuth(options: {
    provider: string;
    options?: { scopes?: string; redirectTo?: string };
  }): Promise<{ error: any }> {
    if (typeof window !== 'undefined') {
      let target = options.options?.redirectTo || '/';
    if (target.includes('/auth/callback')) target = '/';
    window.location.href = `/api/auth/discord?redirectTo=${encodeURIComponent(target)}`;
    }
    return { error: null };
  }

  async signInWithOtp(options: {
    email: string;
    options?: { emailRedirectTo?: string; shouldCreateUser?: boolean };
  }): Promise<{ error: any }> {
    return this.resetPasswordForEmail(options.email, { redirectTo: options.options?.emailRedirectTo });
  }
}
