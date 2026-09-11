// ---------------------------------------------------------------------------
// ALOHA HUNT — client-side READ-ONLY domain helpers.
//
// The authoritative rules (geofence validation, signed QR nonces + replay
// protection, cooldowns, per-location and daily/weekly earning caps,
// impossible-travel detection, point awards, passport stamps, hunt progress,
// drop claims and one-time redemption codes) all live server-side in:
//
//   edge function  verify-checkin  ->  db function app_verify_checkin()
//   edge function  redeem-reward   ->  db function app_redeem_reward()
//   edge function  claim-drop      ->  db function app_claim_drop()
//
// Everything in this file is presentation-only: it explains state to the user
// *before* they act. Nothing here can grant points — the ledger is written
// exclusively by SECURITY DEFINER database functions behind RLS.
// ---------------------------------------------------------------------------
import {
  AlohaDrop, AlohaStop, CheckIn, DropClaim, FraudFlag, Hunt, HuntStop, LatLng, PointRule, PointTransaction,
  Redemption, Reward, UserHuntProgress, UserProfile, UserStamp,
} from '@/data/types';
import { isInGeofence } from '@/lib/geo';

export interface DbState {
  user: UserProfile;
  stops: AlohaStop[];
  pointRules: PointRule[];
  hunts: Hunt[];
  huntStops: HuntStop[];
  rewards: Reward[];
  drops: AlohaDrop[];
  checkIns: CheckIn[];
  transactions: PointTransaction[];
  stamps: UserStamp[];
  huntProgress: UserHuntProgress[];
  redemptions: Redemption[];
  dropClaims: DropClaim[];
  fraudFlags: FraudFlag[];
}

export const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/** Spec MVP default: interaction cooldown is ~15 minutes and admin-configurable. */
export const DEFAULT_INTERACTION_COOLDOWN_MIN = 15;

const FALLBACK_RULE: PointRule = {
  id: '', code: '', label: 'Verified visit', points: 100, cooldown_hours: 24,
  interaction_cooldown_min: DEFAULT_INTERACTION_COOLDOWN_MIN,
  max_per_location_per_week: 3, daily_cap: 800, weekly_cap: 3500, active: true,
};

const within = (iso: string, hours: number) => Date.now() - new Date(iso).getTime() < hours * 3600_000;
const withinMs = (iso: string, ms: number) => Date.now() - new Date(iso).getTime() < ms;

export function interactionCooldownMinutes(rule?: PointRule | null) {
  const n = rule?.interaction_cooldown_min;
  if (typeof n === 'number' && n > 0) return n;
  return DEFAULT_INTERACTION_COOLDOWN_MIN;
}

export function earnedPointsToday(db: DbState) {
  return db.transactions.filter((t) => t.points > 0 && within(t.created_at, 24)).reduce((s, t) => s + t.points, 0);
}

export function earnedPointsThisWeek(db: DbState) {
  return db.transactions.filter((t) => t.points > 0 && within(t.created_at, 24 * 7)).reduce((s, t) => s + t.points, 0);
}

export type StopMapState = 'in-range' | 'cooldown' | 'out-of-range' | 'unknown';

export interface StopEligibility {
  rule: PointRule;
  points: number;
  inRange: boolean;
  distanceM: number | null;
  geofenceM: number;
  interactionMinutes: number;
  lastInteractionAt: Date | null;
  interactionCooling: boolean;
  interactionReadyAt: Date | null;
  canInteract: boolean;
  /** @deprecated use pointsCooling — kept so older screens keep compiling */
  cooling: boolean;
  pointsCooling: boolean;
  nextEligible: Date | null;
  pointsReadyAt: Date | null;
  canEarnPoints: boolean;
  hasVerifiedVisit: boolean;
  weekCount: number;
  atLocationLimit: boolean;
  dailyRemaining: number;
  weeklyRemaining: number;
  stampAlreadyOwned: boolean;
  huntAlreadyCounted: boolean;
  huntsThatCount: { huntId: string; name: string; already: boolean; required: boolean }[];
  mapState: StopMapState;
}

export function checkInEligibility(
  db: DbState,
  stop: AlohaStop,
  opts?: { distanceM?: number | null; userCoords?: LatLng | null; localInteractionAt?: string | null },
): StopEligibility {
  const rule = db.pointRules.find((r) => r.id === stop.point_rule_id) ?? db.pointRules[0] ?? FALLBACK_RULE;
  const mine = db.checkIns.filter((c) => c.stop_id === stop.id && c.status === 'verified');
  const lastCheck = mine.length ? mine.reduce((a, b) => (a.created_at > b.created_at ? a : b)) : undefined;
  const lastIso = [lastCheck?.created_at, opts?.localInteractionAt].filter(Boolean).sort().at(-1) as string | undefined;
  const lastInteractionAt = lastIso ? new Date(lastIso) : null;

  const interactionMinutes = interactionCooldownMinutes(rule);
  const interactionMs = interactionMinutes * 60_000;
  const interactionCooling = lastIso ? withinMs(lastIso, interactionMs) : false;
  const interactionReadyAt = lastInteractionAt
    ? new Date(lastInteractionAt.getTime() + interactionMs)
    : null;

  const pointsCooling = lastCheck ? within(lastCheck.created_at, rule.cooldown_hours) : false;
  const pointsReadyAt = lastCheck
    ? new Date(new Date(lastCheck.created_at).getTime() + rule.cooldown_hours * 3600_000)
    : null;

  const weekCount = mine.filter((c) => within(c.created_at, 24 * 7)).length;
  const dailyRemaining = Math.max(0, rule.daily_cap - earnedPointsToday(db));
  const weeklyRemaining = Math.max(0, rule.weekly_cap - earnedPointsThisWeek(db));
  const atLocationLimit = weekCount >= rule.max_per_location_per_week;

  const distanceM = opts?.distanceM ?? null;
  const inRange = isInGeofence(opts?.userCoords ?? null, stop.coords, stop.geofence_m, distanceM);

  const stampAlreadyOwned = !!(stop.passport_stamp_id && db.stamps.some((s) => s.stamp_id === stop.passport_stamp_id));
  const huntsThatCount = db.huntStops
    .filter((hs) => hs.stop_id === stop.id)
    .map((hs) => {
      const hunt = db.hunts.find((h) => h.id === hs.hunt_id);
      const prog = db.huntProgress.find((p) => p.hunt_id === hs.hunt_id);
      return {
        huntId: hs.hunt_id,
        name: hunt?.name ?? 'Hunt',
        already: !!prog?.completed_stop_ids.includes(stop.id),
        required: hs.required,
      };
    })
    .filter((h) => db.hunts.some((x) => x.id === h.huntId && x.status === 'active'));
  const huntAlreadyCounted = huntsThatCount.length > 0 && huntsThatCount.every((h) => h.already);

  const canEarnPoints = !pointsCooling && !atLocationLimit && dailyRemaining >= rule.points && weeklyRemaining >= rule.points;
  const canInteract = !interactionCooling;

  let mapState: StopMapState = 'unknown';
  if (interactionCooling) mapState = 'cooldown';
  else if (opts?.userCoords) mapState = inRange ? 'in-range' : 'out-of-range';

  return {
    rule,
    points: rule.points,
    inRange,
    distanceM,
    geofenceM: stop.geofence_m,
    interactionMinutes,
    lastInteractionAt,
    interactionCooling,
    interactionReadyAt,
    canInteract,
    cooling: pointsCooling,
    pointsCooling,
    nextEligible: pointsReadyAt,
    pointsReadyAt,
    canEarnPoints,
    hasVerifiedVisit: mine.length > 0,
    weekCount,
    atLocationLimit,
    dailyRemaining,
    weeklyRemaining,
    stampAlreadyOwned,
    huntAlreadyCounted,
    huntsThatCount,
    mapState,
  };
}

export function rewardAvailability(db: DbState, reward: Reward) {
  const remaining = reward.quantity_total - reward.quantity_claimed;
  const mine = db.redemptions.filter((r) => r.reward_id === reward.id);
  return {
    remaining,
    soldOut: remaining <= 0,
    expired: new Date(reward.expires_at).getTime() < Date.now(),
    mineCount: mine.length,
    atUserLimit: mine.length >= reward.per_user_limit,
    affordable: db.user.points_balance >= reward.point_cost,
    shortBy: Math.max(0, reward.point_cost - db.user.points_balance),
  };
}

export function dropStatus(db: DbState, drop: AlohaDrop) {
  const claimed = db.dropClaims.some((c) => c.drop_id === drop.id);
  const remaining = drop.quantity_total - drop.quantity_claimed;
  const live = drop.status === 'live'
    && new Date(drop.starts_at).getTime() <= Date.now()
    && new Date(drop.ends_at).getTime() > Date.now();
  return { claimedByUser: claimed, remaining, live, soldOut: remaining <= 0 };
}

export function formatWhen(d: Date) {
  const diff = d.getTime() - Date.now();
  const h = Math.ceil(diff / 3600_000);
  if (h <= 0) return 'now';
  if (h < 24) return `in ${h} hour${h === 1 ? '' : 's'}`;
  return `on ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function formatCountdown(until: Date | string) {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return '0:00';
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
