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
  AlohaDrop, AlohaStop, CheckIn, DropClaim, FraudFlag, Hunt, HuntStop, PointRule, PointTransaction,
  Redemption, Reward, UserHuntProgress, UserProfile, UserStamp,
} from '@/data/types';

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

const within = (iso: string, hours: number) => Date.now() - new Date(iso).getTime() < hours * 3600_000;

export function earnedPointsToday(db: DbState) {
  return db.transactions.filter((t) => t.points > 0 && within(t.created_at, 24)).reduce((s, t) => s + t.points, 0);
}

export function earnedPointsThisWeek(db: DbState) {
  return db.transactions.filter((t) => t.points > 0 && within(t.created_at, 24 * 7)).reduce((s, t) => s + t.points, 0);
}

/** Pre-flight explanation of what the server will decide for this stop. */
export function checkInEligibility(db: DbState, stop: AlohaStop) {
  const rule = db.pointRules.find((r) => r.id === stop.point_rule_id) ?? db.pointRules[0]
    ?? { id: '', code: '', label: 'Verified visit', points: 100, cooldown_hours: 24, max_per_location_per_week: 3, daily_cap: 800, weekly_cap: 3500, active: true };
  const mine = db.checkIns.filter((c) => c.stop_id === stop.id && c.status === 'verified');
  const last = mine.length ? mine.reduce((a, b) => (a.created_at > b.created_at ? a : b)) : undefined;
  const cooling = last ? within(last.created_at, rule.cooldown_hours) : false;
  const weekCount = mine.filter((c) => within(c.created_at, 24 * 7)).length;
  return {
    rule,
    points: rule.points,
    cooling,
    nextEligible: last ? new Date(new Date(last.created_at).getTime() + rule.cooldown_hours * 3600_000) : null,
    weekCount,
    atLocationLimit: weekCount >= rule.max_per_location_per_week,
    dailyRemaining: Math.max(0, rule.daily_cap - earnedPointsToday(db)),
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
