import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAuthUser, getEnabledOAuthProviders, supabase, unwrapAuthUser, type AuthUser } from '@/lib/supabase';
import {
  Adventure, AlohaDrop, AlohaStop, AppNotification, AuditLog, Business, Category, CheckIn, DropClaim,
  Favorite, FraudFlag, Hunt, HuntStop, Island, LatLng, NotificationChannel, PartnerSubmission,
  PassportMilestone, PassportStampDef, PointRule, PointTransaction, Promotion, Redemption, Region,
  Reward, Role, UserHuntProgress, UserProfile, UserStamp,
} from '@/data/types';
import { DEMO_LOCATIONS, IMAGES } from '@/data/seed';
import { DbState } from '@/lib/engine';
import { distanceMeters } from '@/lib/geo';

// ---------------------------------------------------------------------------
// Aloha Hunt client store — database backed.
// Catalog + user records are read from Postgres under RLS. Every privileged
// mutation (check-in, redemption, drop claim) is delegated to an edge function
// which calls a SECURITY DEFINER database function, so the client can never
// write points, stamps, hunt progress or redemption codes directly.
// ---------------------------------------------------------------------------

export type Screen =
  | { name: 'explore' } | { name: 'hunts' } | { name: 'passport' } | { name: 'rewards' } | { name: 'profile' }
  | { name: 'stop'; id: string } | { name: 'hunt'; id: string } | { name: 'drops' } | { name: 'drop'; id: string }
  | { name: 'region'; id: string } | { name: 'reward'; id: string } | { name: 'surprise' }
  | { name: 'adventure'; id?: string } | { name: 'saved' } | { name: 'myrewards' } | { name: 'notifications' }
  | { name: 'settings' } | { name: 'points' } | { name: 'activity' } | { name: 'achievements' } | { name: 'myhunts' };

export type LocationStatus = 'unknown' | 'granted' | 'denied' | 'demo';

interface Toast { id: string; title: string; body?: string; tone: 'success' | 'error' | 'info' }

export interface CheckInResult {
  ok: boolean;
  failure?: string;
  message?: string;
  detail?: string;
  distance_m?: number;
  points?: number;
  stampId?: string | null;
  huntProgressed?: { huntId: string; completed: boolean; completionPoints: number; bonusPoints: number }[];
  drop?: { dropId: string; points: number; rewardLabel?: string } | null;
  newBalance?: number;
}

export interface RedeemResult {
  ok: boolean;
  failure?: string;
  message?: string;
  detail?: string;
  redemption?: Redemption;
  newBalance?: number;
}

type FullDb = DbState & {
  regions: Region[]; categories: Category[]; islands: Island[]; businesses: Business[];
  promotions: Promotion[]; stampDefs: PassportStampDef[]; milestones: PassportMilestone[];
  favorites: Favorite[]; notifications: AppNotification[]; prefs: Record<NotificationChannel, boolean>;
  submissions: PartnerSubmission[]; audits: AuditLog[]; adventures: Adventure[];
};

interface AlohaContextValue {
  phase: 'onboarding' | 'auth' | 'app';
  setPhase: (p: 'onboarding' | 'auth' | 'app') => void;
  completeOnboarding: () => void;
  authChecked: boolean;
  loading: boolean;
  authError: string;
  signInEmail: (email: string, password: string) => Promise<boolean>;
  signUpEmail: (email: string, password: string, name: string) => Promise<boolean>;
  signInOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signInDemo: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: Role) => Promise<void>;
  refresh: () => Promise<void>;
  screen: Screen;
  tab: 'explore' | 'hunts' | 'passport' | 'rewards' | 'profile';
  go: (s: Screen) => void;
  back: () => void;
  canGoBack: boolean;
  locStatus: LocationStatus;
  coords: LatLng | null;
  requestLocation: () => Promise<void>;
  denyLocation: () => void;
  setDemoLocation: (c: LatLng, label: string) => void;
  demoLabel: string;
  distanceTo: (c: LatLng) => number | null;
  db: FullDb;
  doCheckIn: (stopId: string, method: 'gps' | 'qr', coordsOverride?: LatLng | null, qrNonce?: string) => Promise<CheckInResult>;
  doRedeem: (rewardId: string) => Promise<RedeemResult>;
  markRedemptionUsed: (id: string) => Promise<void>;
  claimDrop: (dropId: string) => Promise<{ ok: boolean; message: string }>;
  toggleFavorite: (type: Favorite['entity_type'], id: string) => Promise<void>;
  isFavorite: (type: Favorite['entity_type'], id: string) => boolean;
  startHunt: (huntId: string) => Promise<void>;
  saveAdventure: (a: Adventure) => void;
  markNotificationsRead: () => Promise<void>;
  setPref: (c: NotificationChannel, v: boolean) => Promise<void>;
  updatePointRule: (id: string, points: number) => Promise<void>;
  updateRule: (id: string, patch: Partial<PointRule>) => Promise<void>;
  updateStop: (id: string, patch: Partial<AlohaStop>) => Promise<void>;
  updateReward: (id: string, patch: Partial<Reward>) => Promise<void>;
  updateHunt: (id: string, patch: Partial<Hunt>) => Promise<void>;
  updateDrop: (id: string, patch: Partial<AlohaDrop>) => Promise<void>;
  updateSubmission: (id: string, status: PartnerSubmission['status']) => Promise<void>;
  updateFlag: (id: string, status: FraudFlag['status']) => Promise<void>;
  addSubmission: (s: Omit<PartnerSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<void>;
  logAudit: (actor: string, action: string, target: string) => Promise<void>;
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  pointsPulse: number;
}

const Ctx = createContext<AlohaContextValue | null>(null);
export const useAloha = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAloha must be used inside AlohaProvider');
  return v;
};

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const DEMO_EMAIL = 'kai@alohahunt.demo';
const DEMO_PASSWORD = 'AlohaHunt2026!';
export const DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
const ONBOARDED_KEY = 'aloha-hunt-onboarded';

const readOnboarded = () => {
  try { return window.localStorage.getItem(ONBOARDED_KEY) === '1'; } catch { return false; }
};
const writeOnboarded = () => {
  try { window.localStorage.setItem(ONBOARDED_KEY, '1'); } catch { /* ignore quota / private mode */ }
};

const emptyDb: FullDb = {
  user: {
    id: '', name: 'Explorer', email: '', avatar: IMAGES.avatar, role: 'consumer', island_id: 'isl_oahu',
    status_label: 'Oʻahu Explorer', member_since: '', points_balance: 0,
  },
  stops: [], pointRules: [], hunts: [], huntStops: [], rewards: [], drops: [], checkIns: [],
  transactions: [], stamps: [], huntProgress: [], redemptions: [], dropClaims: [], fraudFlags: [],
  regions: [], categories: [], islands: [], businesses: [], promotions: [], stampDefs: [], milestones: [],
  favorites: [], notifications: [],
  prefs: { drops: true, hunts: true, rewards: true, expirations: true, passport: true, promotions: false, account: true },
  submissions: [], audits: [], adventures: [],
};

const mapStop = (r: Record<string, unknown>): AlohaStop => ({
  ...(r as unknown as AlohaStop),
  coords: { lat: Number(r.lat), lng: Number(r.lng) },
  rating: Number(r.rating),
  hours: (r.hours as AlohaStop['hours']) ?? [],
  images: (r.images as string[]) ?? [],
  moods: (r.moods as string[]) ?? [],
});
const mapRegion = (r: Record<string, unknown>): Region => ({
  id: String(r.id), island_id: String(r.island_id), name: String(r.name), blurb: String(r.blurb ?? ''),
  center: { lat: Number(r.lat), lng: Number(r.lng) },
});
const mapIsland = (r: Record<string, unknown>): Island => ({
  id: String(r.id), destination_id: String(r.destination_id), name: String(r.name), slug: String(r.slug),
  status: r.status as Island['status'], center: { lat: Number(r.lat), lng: Number(r.lng) },
});
const mapProfile = (r: Record<string, unknown>, fallbackEmail: string): UserProfile => ({
  id: String(r.id),
  name: String(r.name ?? 'Explorer'),
  email: String(r.email ?? fallbackEmail),
  avatar: String(r.avatar ?? '') || IMAGES.avatar,
  role: (r.role as Role) ?? 'consumer',
  island_id: String(r.island_id ?? 'isl_oahu'),
  status_label: String(r.status_label ?? 'Oʻahu Explorer'),
  member_since: new Date(String(r.member_since ?? new Date().toISOString()))
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  points_balance: Number(r.points_balance ?? 0),
});

export const AlohaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<'onboarding' | 'auth' | 'app'>('onboarding');
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [stack, setStack] = useState<Screen[]>([{ name: 'explore' }]);
  const [locStatus, setLocStatus] = useState<LocationStatus>('unknown');
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [demoLabel, setDemoLabel] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pointsPulse, setPointsPulse] = useState(0);
  const [db, setDb] = useState<FullDb>(emptyDb);
  const adventuresRef = useRef<Adventure[]>([]);
  const activeUserId = useRef<string | null>(null);
  const enteringRef = useRef(false);
  const authCheckedRef = useRef(false);
  const enterRef = useRef<(user?: AuthUser | null, name?: string, email?: string) => Promise<boolean>>(async () => false);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('t');
    setToasts((p) => [...p, { ...t, id }]);
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3800);
  }, []);

  // --- load everything -----------------------------------------------------
  const loadAll = useCallback(async (email: string) => {
    const [
      islands, regions, categories, rules, businesses, stops, hunts, huntStops, rewards,
      stampDefs, milestones, drops, promos, submissions,
      profile, checkIns, transactions, stamps, huntProgress, redemptions, dropClaims,
      favorites, notifications, prefs, flags, audits,
    ] = await Promise.all([
      supabase.from('islands').select('*').order('name'),
      supabase.from('regions').select('*').order('name'),
      supabase.from('categories').select('*'),
      supabase.from('point_rules').select('*').order('points'),
      supabase.from('businesses').select('*').order('name'),
      supabase.from('aloha_stops').select('*').order('name'),
      supabase.from('hunts').select('*').order('completion_points', { ascending: false }),
      supabase.from('hunt_stops').select('*').order('sequence'),
      supabase.from('rewards').select('*').order('point_cost'),
      supabase.from('passport_definitions').select('*'),
      supabase.from('passport_milestones').select('*').order('stamps_required'),
      supabase.from('aloha_drops').select('*'),
      supabase.from('promotions').select('*'),
      supabase.from('partner_submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('user_profiles').select('*').limit(1),
      supabase.from('checkins').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('point_transactions').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('passport_stamps').select('*'),
      supabase.from('user_hunt_progress').select('*'),
      supabase.from('reward_redemptions').select('*').order('created_at', { ascending: false }),
      supabase.from('drop_claims').select('*'),
      supabase.from('favorites').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('notification_preferences').select('*').limit(1),
      supabase.from('fraud_flags').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(60),
    ]);

    const prefRow = (prefs.data ?? [])[0] as Record<string, boolean> | undefined;
    const profileRow = (profile.data ?? [])[0] as Record<string, unknown> | undefined;
    const favRows = (favorites.data ?? []) as (Favorite & { payload?: Adventure })[];
    const savedAdventures = favRows
      .filter((f) => f.entity_type === 'adventure' && f.payload)
      .map((f) => f.payload as Adventure);
    adventuresRef.current = [...savedAdventures, ...adventuresRef.current.filter((a) => !savedAdventures.some((s) => s.id === a.id))];

    setDb({
      islands: (islands.data ?? []).map(mapIsland),
      regions: (regions.data ?? []).map(mapRegion),
      categories: (categories.data ?? []) as Category[],
      pointRules: (rules.data ?? []) as PointRule[],
      businesses: (businesses.data ?? []) as Business[],
      stops: (stops.data ?? []).map(mapStop),
      hunts: (hunts.data ?? []) as Hunt[],
      huntStops: (huntStops.data ?? []) as HuntStop[],
      rewards: (rewards.data ?? []) as Reward[],
      stampDefs: (stampDefs.data ?? []) as PassportStampDef[],
      milestones: (milestones.data ?? []) as PassportMilestone[],
      drops: (drops.data ?? []) as AlohaDrop[],
      promotions: (promos.data ?? []) as Promotion[],
      submissions: (submissions.data ?? []) as PartnerSubmission[],
      user: profileRow ? mapProfile(profileRow, email) : { ...emptyDb.user, email },
      checkIns: (checkIns.data ?? []) as CheckIn[],
      transactions: (transactions.data ?? []) as PointTransaction[],
      stamps: (stamps.data ?? []) as UserStamp[],
      huntProgress: (huntProgress.data ?? []) as UserHuntProgress[],
      redemptions: (redemptions.data ?? []) as Redemption[],
      dropClaims: (dropClaims.data ?? []) as DropClaim[],
      favorites: favRows,
      notifications: (notifications.data ?? []) as AppNotification[],
      fraudFlags: (flags.data ?? []) as FraudFlag[],
      audits: (audits.data ?? []) as AuditLog[],
      prefs: {
        drops: prefRow?.drops ?? true, hunts: prefRow?.hunts ?? true, rewards: prefRow?.rewards ?? true,
        expirations: prefRow?.expirations ?? true, passport: prefRow?.passport ?? true,
        promotions: prefRow?.promotions ?? false, account: prefRow?.account ?? true,
      },
      adventures: adventuresRef.current,
    });
  }, []);

  const resetToSignedOut = useCallback(() => {
    activeUserId.current = null;
    enteringRef.current = false;
    setDb(emptyDb);
    setStack([{ name: 'explore' }]);
    setPhase(readOnboarded() ? 'auth' : 'onboarding');
    setLoading(false);
    authCheckedRef.current = true;
    setAuthChecked(true);
  }, []);

  const enter = useCallback(async (fromUser?: AuthUser | null, name?: string, email?: string) => {
    if (fromUser?.id && enteringRef.current && activeUserId.current === fromUser.id) {
      authCheckedRef.current = true;
      setAuthChecked(true);
      return true;
    }
    setLoading(true);
    setAuthError('');
    try {
      const user = fromUser ?? await getAuthUser();
      if (!user?.id) {
        resetToSignedOut();
        return false;
      }
      if (enteringRef.current && activeUserId.current === user.id) {
        setLoading(false);
        authCheckedRef.current = true;
        setAuthChecked(true);
        return true;
      }
      enteringRef.current = true;
      activeUserId.current = user.id;
      const meta = (user.user_metadata ?? {}) as Record<string, string>;
      const displayName = name || meta.name
        || (user.email === DEMO_EMAIL ? 'Kai' : (user.email ?? email ?? 'explorer').split('@')[0]);
      const { error: bootErr } = await supabase.rpc('app_bootstrap_user', {
        p_name: displayName,
        p_email: user.email ?? email ?? '',
        p_avatar: meta.avatar_url || IMAGES.avatar,
        p_seed: true,
      });
      if (bootErr) {
        enteringRef.current = false;
        activeUserId.current = null;
        setAuthError(bootErr.message || 'Could not create your explorer profile.');
        setLoading(false);
        authCheckedRef.current = true;
        setAuthChecked(true);
        return false;
      }
      await loadAll(user.email ?? email ?? '');
      writeOnboarded();
      setPhase('app');
      setStack([{ name: 'explore' }]);
      return true;
    } catch (err) {
      enteringRef.current = false;
      activeUserId.current = null;
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      setPhase(readOnboarded() ? 'auth' : 'onboarding');
      return false;
    } finally {
      setLoading(false);
      authCheckedRef.current = true;
      setAuthChecked(true);
    }
  }, [loadAll, resetToSignedOut]);

  enterRef.current = enter;

  const refresh = useCallback(async () => {
    const user = await getAuthUser();
    if (user) await loadAll(user.email ?? '');
  }, [loadAll]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Keep this callback sync — awaiting supabase here deadlocks the auth lock.
      window.setTimeout(() => {
        if (event === 'SIGNED_OUT') {
          resetToSignedOut();
          return;
        }
        if (event === 'TOKEN_REFRESHED') return;
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          const user = unwrapAuthUser(session?.user);
          if (user?.id) {
            if (activeUserId.current === user.id) return;
            void enterRef.current(user);
            return;
          }
          if (event === 'INITIAL_SESSION') resetToSignedOut();
        }
      }, 0);
    });
    const fallback = window.setTimeout(() => {
      if (authCheckedRef.current || activeUserId.current) return;
      void (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = unwrapAuthUser(session?.user);
        if (user?.id) {
          if (activeUserId.current === user.id) return;
          void enterRef.current(user);
        } else {
          resetToSignedOut();
        }
      })();
    }, 2500);
    return () => {
      window.clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [resetToSignedOut]);

  const completeOnboarding = useCallback(() => {
    writeOnboarded();
    setPhase('auth');
  }, []);

  // --- auth ----------------------------------------------------------------
  const signInEmail = useCallback(async (email: string, password: string) => {
    setAuthError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setLoading(false);
      setAuthError(error?.message || 'Invalid email or password.');
      return false;
    }
    return enter(unwrapAuthUser(data.user) ?? unwrapAuthUser(data.session.user), undefined, email);
  }, [enter]);

  const signUpEmail = useCallback(async (email: string, password: string, name: string) => {
    setAuthError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) {
      setLoading(false);
      setAuthError(error.message);
      return false;
    }
    const sessionUser = unwrapAuthUser(data.session?.user) ?? unwrapAuthUser(data.user);
    if (data.session && sessionUser) {
      return enter(sessionUser, name, email);
    }
    const { data: signedIn, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr || !signedIn.session) {
      setLoading(false);
      setAuthError('Account created. Check your email to confirm, then sign in.');
      return false;
    }
    return enter(unwrapAuthUser(signedIn.user) ?? unwrapAuthUser(signedIn.session.user), name, email);
  }, [enter]);

  const signInDemo = useCallback(async () => {
    setAuthError('');
    setLoading(true);
    const first = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    let session = first.data.session;
    let user = first.data.user;
    let errorMessage = first.error?.message ?? '';
    if (!session) {
      const signedUp = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: { data: { name: 'Kai' }, emailRedirectTo: window.location.origin },
      });
      if (signedUp.data.session) {
        session = signedUp.data.session;
        user = signedUp.data.user;
        errorMessage = '';
      } else {
        const retry = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
        session = retry.data.session;
        user = retry.data.user;
        errorMessage = retry.error?.message ?? signedUp.error?.message ?? '';
      }
    }
    if (!session) {
      setLoading(false);
      setAuthError(errorMessage || 'Could not open the demo account. Try email sign-in instead.');
      return false;
    }
    return enter(unwrapAuthUser(user) ?? unwrapAuthUser(session.user), 'Kai', DEMO_EMAIL);
  }, [enter]);

  const signInOAuth = useCallback(async (provider: 'google' | 'apple') => {
    setAuthError('');
    const enabled = await getEnabledOAuthProviders();
    if (!enabled[provider]) {
      setAuthError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is not enabled on this project yet — use email or the demo account.`);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin, skipBrowserRedirect: false },
    });
    if (error) {
      setAuthError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is not enabled on this project yet — use email or the demo account.`);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) {
      toast({ title: 'Could not send reset link', body: error.message, tone: 'error' });
      return;
    }
    toast({ title: 'Reset link sent', body: `Check ${email} for a secure reset link.`, tone: 'success' });
  }, [toast]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    resetToSignedOut();
  }, [resetToSignedOut]);

  const setRole = useCallback(async (role: Role) => {
    await supabase.rpc('app_set_role', { p_role: role });
    await refresh();
    toast({ title: 'Role updated', body: `Signed in as ${role.replace('_', ' ')}.`, tone: 'success' });
  }, [refresh, toast]);

  // --- navigation ----------------------------------------------------------
  const TABS = ['explore', 'hunts', 'passport', 'rewards', 'profile'] as const;
  const screen = stack[stack.length - 1];
  const go = useCallback((s: Screen) => {
    setStack((prev) => {
      if ((TABS as readonly string[]).includes(s.name)) return [s];
      const last = prev[prev.length - 1];
      if (last.name === s.name && (last as { id?: string }).id === (s as { id?: string }).id) return prev;
      return [...prev, s];
    });
    window.requestAnimationFrame(() => document.getElementById('aloha-scroll')?.scrollTo({ top: 0 }));
  }, []);
  const back = useCallback(() => setStack((p) => (p.length > 1 ? p.slice(0, -1) : p)), []);
  const tab = useMemo(() => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const n = stack[i].name;
      if ((TABS as readonly string[]).includes(n)) return n as typeof TABS[number];
    }
    return 'explore';
  }, [stack]);

  // --- location ------------------------------------------------------------
  const requestLocation = useCallback(async () => {
    const fallback = () => {
      setLocStatus('demo');
      setCoords(DEMO_LOCATIONS[0].coords);
      setDemoLabel(DEMO_LOCATIONS[0].label);
    };
    if (!('geolocation' in navigator)) {
      fallback();
      toast({ title: 'Demo location active', body: 'GPS is unavailable in preview. Using a simulated Oʻahu position.', tone: 'info' });
      return;
    }
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => { fallback(); resolve(); }, 6000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          window.clearTimeout(timer);
          const real = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const onOahu = real.lat > 21.1 && real.lat < 21.9 && real.lng > -158.5 && real.lng < -157.4;
          if (onOahu) { setLocStatus('granted'); setCoords(real); setDemoLabel(''); } else {
            fallback();
            toast({ title: 'Demo location active', body: 'You are outside the Oʻahu market, so a simulated position is used.', tone: 'info' });
          }
          resolve();
        },
        () => {
          window.clearTimeout(timer);
          fallback();
          toast({ title: 'Demo location active', body: 'Device GPS was blocked. Using a simulated Oʻahu position for the demo.', tone: 'info' });
          resolve();
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });
  }, [toast]);

  const denyLocation = useCallback(() => { setLocStatus('denied'); setCoords(null); setDemoLabel(''); }, []);
  const setDemoLocation = useCallback((c: LatLng, label: string) => { setLocStatus('demo'); setCoords(c); setDemoLabel(label); }, []);
  const distanceTo = useCallback((c: LatLng) => (coords ? distanceMeters(coords, c) : null), [coords]);

  // --- privileged actions via edge functions --------------------------------
  const doCheckIn = useCallback(async (stopId: string, method: 'gps' | 'qr', coordsOverride?: LatLng | null, qrNonce?: string): Promise<CheckInResult> => {
    const useCoords = coordsOverride !== undefined ? coordsOverride : coords;
    const { data, error } = await supabase.functions.invoke('verify-checkin', {
      body: {
        stopId,
        method,
        lat: useCoords?.lat ?? null,
        lng: useCoords?.lng ?? null,
        qrNonce: qrNonce ?? null,
        idempotencyKey: `chk:${stopId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        deviceHash: 'dev_9f31',
      },
    });
    if (error || !data) {
      return { ok: false, failure: 'network', message: 'Network problem', detail: 'We could not reach the verification service. Check your connection and try again.' };
    }
    const res = data as CheckInResult;
    if (res.ok) setPointsPulse((n) => n + 1);
    await refresh();
    return res;
  }, [coords, refresh]);

  const doRedeem = useCallback(async (rewardId: string): Promise<RedeemResult> => {
    const { data, error } = await supabase.functions.invoke('redeem-reward', {
      body: { rewardId, idempotencyKey: `rdm:${rewardId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}` },
    });
    if (error || !data) {
      return { ok: false, failure: 'network', message: 'Network problem', detail: 'We could not reach the redemption service. Please retry.' };
    }
    const res = data as RedeemResult;
    if (res.ok) {
      setPointsPulse((n) => n + 1);
      await refresh();
    }
    return res;
  }, [refresh]);

  const markRedemptionUsed = useCallback(async (id: string) => {
    const { data } = await supabase.functions.invoke('redeem-reward', { body: { action: 'mark_used', redemptionId: id } });
    const res = data as { ok: boolean; message?: string } | null;
    await refresh();
    toast(res?.ok
      ? { title: 'Marked as used', body: 'Partner verification recorded. This code can no longer be redeemed.', tone: 'info' }
      : { title: res?.message ?? 'Unable to update', tone: 'error' });
  }, [refresh, toast]);

  const claimDrop = useCallback(async (dropId: string) => {
    const { data, error } = await supabase.functions.invoke('claim-drop', { body: { dropId } });
    if (error || !data) return { ok: false, message: 'Could not reach the Drop service' };
    const res = data as { ok: boolean; message: string; stopId?: string };
    if (res.stopId) go({ name: 'stop', id: res.stopId });
    return { ok: res.ok, message: res.message };
  }, [go]);

  // --- user-scoped writes (RLS enforced) -----------------------------------
  const toggleFavorite = useCallback(async (type: Favorite['entity_type'], id: string) => {
    const existing = db.favorites.find((f) => f.entity_type === type && f.entity_id === id);
    if (existing) {
      setDb((p) => ({ ...p, favorites: p.favorites.filter((f) => f.id !== existing.id) }));
      await supabase.from('favorites').delete().eq('id', existing.id);
      toast({ title: 'Removed from Saved', tone: 'info' });
      return;
    }
    const user = await getAuthUser();
    if (!user) return;
    const { data } = await supabase.from('favorites')
      .insert({ user_id: user.id, entity_type: type, entity_id: id }).select('*').limit(1);
    const row = (data ?? [])[0] as Favorite | undefined;
    if (row) setDb((p) => ({ ...p, favorites: [row, ...p.favorites] }));
    toast({ title: 'Saved', body: 'Find it later under Profile › Saved.', tone: 'success' });
  }, [db.favorites, toast]);

  const isFavorite = useCallback((type: Favorite['entity_type'], id: string) =>
    db.favorites.some((f) => f.entity_type === type && f.entity_id === id), [db.favorites]);

  const startHunt = useCallback(async (huntId: string) => {
    await supabase.rpc('app_start_hunt', { p_hunt_id: huntId });
    await refresh();
    toast({ title: 'Hunt started', body: 'Check in at each stop to make progress.', tone: 'success' });
  }, [refresh, toast]);

  const saveAdventure = useCallback((a: Adventure) => {
    adventuresRef.current = adventuresRef.current.some((x) => x.id === a.id) ? adventuresRef.current : [a, ...adventuresRef.current];
    setDb((p) => ({ ...p, adventures: adventuresRef.current }));
    void (async () => {
      const user = await getAuthUser();
      if (!user) return;
      const { data } = await supabase.from('favorites')
        .insert({ user_id: user.id, entity_type: 'adventure', entity_id: a.id, payload: a as unknown as Record<string, unknown> })
        .select('*').limit(1);
      const row = (data ?? [])[0] as Favorite | undefined;
      if (row) setDb((p) => ({ ...p, favorites: [row, ...p.favorites] }));
    })();
    toast({ title: 'Adventure saved', body: `${a.title} is in your Saved list.`, tone: 'success' });
  }, [toast]);

  const markNotificationsRead = useCallback(async () => {
    if (!db.notifications.some((n) => !n.read)) return;
    setDb((p) => ({ ...p, notifications: p.notifications.map((n) => ({ ...n, read: true })) }));
    const user = await getAuthUser();
    if (user) await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  }, [db.notifications]);

  const setPref = useCallback(async (c: NotificationChannel, v: boolean) => {
    setDb((p) => ({ ...p, prefs: { ...p.prefs, [c]: v } }));
    const user = await getAuthUser();
    if (user) await supabase.from('notification_preferences').upsert({ user_id: user.id, [c]: v });
  }, []);

  // --- admin / partner writes (role policies enforce permission) ------------
  const logAudit = useCallback(async (_actor: string, action: string, target: string) => {
    await supabase.rpc('app_admin_audit', { p_action: action, p_target: target });
  }, []);

  const patchTable = useCallback(async (
    table: string, key: keyof FullDb, id: string, patch: Record<string, unknown>,
  ) => {
    setDb((p) => ({
      ...p,
      [key]: (p[key] as unknown as { id: string }[]).map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) {
      toast({ title: 'Not permitted', body: 'Your role cannot change this record. Switch to the admin role in Profile.', tone: 'error' });
      await refresh();
      return false;
    }
    return true;
  }, [refresh, toast]);

  const updateRule = useCallback(async (id: string, patch: Partial<PointRule>) => {
    await patchTable('point_rules', 'pointRules', id, patch as Record<string, unknown>);
  }, [patchTable]);

  const updatePointRule = useCallback(async (id: string, points: number) => {
    const ok = await patchTable('point_rules', 'pointRules', id, { points });
    if (ok) {
      await logAudit('admin', `Updated point rule → ${points} pts`, id);
      await refresh();
      toast({ title: 'Point rule updated', body: 'The consumer app now reads the new value from the database.', tone: 'success' });
    }
  }, [logAudit, patchTable, refresh, toast]);

  const updateStop = useCallback(async (id: string, patch: Partial<AlohaStop>) => {
    const clean: Record<string, unknown> = { ...patch };
    delete clean.coords;
    await patchTable('aloha_stops', 'stops', id, clean);
  }, [patchTable]);

  const updateReward = useCallback(async (id: string, patch: Partial<Reward>) => {
    await patchTable('rewards', 'rewards', id, patch as Record<string, unknown>);
  }, [patchTable]);
  const updateHunt = useCallback(async (id: string, patch: Partial<Hunt>) => {
    await patchTable('hunts', 'hunts', id, patch as Record<string, unknown>);
  }, [patchTable]);
  const updateDrop = useCallback(async (id: string, patch: Partial<AlohaDrop>) => {
    await patchTable('aloha_drops', 'drops', id, patch as Record<string, unknown>);
  }, [patchTable]);
  const updateSubmission = useCallback(async (id: string, status: PartnerSubmission['status']) => {
    await patchTable('partner_submissions', 'submissions', id, { status });
  }, [patchTable]);
  const updateFlag = useCallback(async (id: string, status: FraudFlag['status']) => {
    await patchTable('fraud_flags', 'fraudFlags', id, { status });
  }, [patchTable]);

  const addSubmission = useCallback(async (s: Omit<PartnerSubmission, 'id' | 'submitted_at' | 'status'>) => {
    const { error } = await supabase.from('partner_submissions').insert({
      id: uid('sub'), business_id: s.business_id, kind: s.kind, title: s.title, status: 'pending',
    });
    if (error) {
      toast({ title: 'Not permitted', body: 'Switch to the business user role in Profile to submit partner content.', tone: 'error' });
      return;
    }
    await refresh();
    toast({ title: 'Submitted for approval', body: 'Admin review is required before it goes live.', tone: 'success' });
  }, [refresh, toast]);

  const value: AlohaContextValue = {
    phase, setPhase, completeOnboarding, authChecked, loading, authError,
    signInEmail, signUpEmail, signInOAuth, signInDemo, resetPassword, signOut, setRole, refresh,
    screen, tab, go, back, canGoBack: stack.length > 1,
    locStatus, coords, requestLocation, denyLocation, setDemoLocation, demoLabel, distanceTo,
    db, doCheckIn, doRedeem, markRedemptionUsed, claimDrop, toggleFavorite, isFavorite,
    startHunt, saveAdventure, markNotificationsRead, setPref,
    updatePointRule, updateRule, updateStop, updateReward, updateHunt, updateDrop,
    updateSubmission, updateFlag, addSubmission, logAudit,
    toasts, toast, pointsPulse,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
