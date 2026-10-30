'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { User, Session, AuthChangeEvent } from '@/lib/db/types';
import { Profile } from '@/types';
import { getDbBrowserClient } from '@/lib/db/client';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  accessToken: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, userObj?: User | null) => {
    try {
      const db = getDbBrowserClient();
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        return;
      }
    } catch {}

    // Fallback: build profile in memory from userObj so UI is fully populated
    if (userObj) {
      const fallbackName =
        userObj.user_metadata?.server_display_name ||
        userObj.user_metadata?.custom_claims?.global_name ||
        userObj.user_metadata?.display_name ||
        userObj.email?.split('@')[0] ||
        'Member';

      const fallbackProfile: Profile = {
        id: userId,
        email: userObj.email || null,
        display_name: fallbackName,
        server_display_name: fallbackName,
        role: (userObj.role === 'admin' ? 'admin' : 'user') as any,
        created_at: new Date().toISOString(),
        avatar_url: userObj.user_metadata?.avatar_url || null,
      };
      setProfile(fallbackProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user);
  }, [user, fetchProfile]);

  useEffect(() => {
    const db = getDbBrowserClient();

    db.auth.getSession().then((res: { data: { session: Session | null } }) => {
      const session: Session | null = res.data?.session ?? null;
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      if (session?.user) {
        if (session.access_token && session.refresh_token) {
          db.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }).catch(() => {});
        }
        fetchProfile(session.user.id, session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = db.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setAccessToken(session?.access_token ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const db = getDbBrowserClient();
    await db.auth.signOut();
    setUser(null);
    setProfile(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, accessToken, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
