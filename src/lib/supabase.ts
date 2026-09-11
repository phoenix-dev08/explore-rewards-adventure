import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = 'https://enuohzfsitcugbutgsgz.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjJhNDk1MzgyLTk3ODMtNDYwZC04Y2I3LWJkZTI4NjBiMmRhYyJ9.eyJwcm9qZWN0SWQiOiJlbnVvaHpmc2l0Y3VnYnV0Z3NneiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg5MTUyNDMwLCJleHAiOjIxMDQ1MTI0MzAsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.5IRpH0eOHc7x4zIQgaVrSaWJSflp5sf-oegiqv7yX30';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'aloha-hunt-auth',
  },
});

export type AuthUser = Pick<User, 'id'> & Partial<User>;

/** DatabasePad wraps GET /user as `{ user, aud }` while GoTrue returns the user directly. */
export function unwrapAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id === 'string' && record.id) return record as AuthUser;
  const nested = record.user;
  if (nested && typeof nested === 'object') {
    const inner = nested as Record<string, unknown>;
    if (typeof inner.id === 'string' && inner.id) return inner as AuthUser;
  }
  return null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const fromSession = unwrapAuthUser(session?.user);
  if (fromSession) {
    return {
      ...fromSession,
      email: fromSession.email || session?.user?.email,
      user_metadata: fromSession.user_metadata ?? session?.user?.user_metadata,
    };
  }
  const { data } = await supabase.auth.getUser();
  return unwrapAuthUser(data.user);
}

export async function getEnabledOAuthProviders(): Promise<{ google: boolean; apple: boolean }> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const json = await res.json() as { external?: { google?: boolean; apple?: boolean } };
    return {
      google: Boolean(json?.external?.google),
      apple: Boolean(json?.external?.apple),
    };
  } catch {
    return { google: false, apple: false };
  }
}

export { supabase, supabaseUrl };
