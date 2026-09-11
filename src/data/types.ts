// ---------------------------------------------------------------------------
// ALOHA HUNT — shared domain types
// These mirror the backend/relational schema (see src/data/seed.ts for the
// seeded records). Nothing in the UI should invent its own shape.
// ---------------------------------------------------------------------------

export type Role = 'consumer' | 'business_user' | 'admin';

export interface Destination {
  id: string;
  name: string; // e.g. "Hawaiʻi, USA"
  country: string;
}

export interface Island {
  id: string;
  destination_id: string;
  name: string; // Oʻahu
  slug: string;
  status: 'live' | 'coming_soon';
  center: LatLng;
}

export interface Region {
  id: string;
  island_id: string;
  name: string;
  blurb: string;
  center: LatLng;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Business {
  id: string;
  name: string;
  legal_name: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  status: 'active' | 'pending' | 'suspended';
  owner_user_id: string;
}

export interface OpeningHour {
  day: number; // 0 = Sun
  open: string; // "07:00"
  close: string; // "16:00"
}

export interface AlohaStop {
  id: string;
  business_id: string;
  island_id: string;
  region_id: string;
  category_id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  coords: LatLng;
  images: string[];
  hours: OpeningHour[];
  price_tier: 1 | 2 | 3 | 4; // $ .. $$$$
  avg_minutes: number;
  avg_spend: number;
  rating: number;
  review_count: number;
  point_rule_id: string;
  passport_stamp_id?: string;
  geofence_m: number;
  qr_enabled: boolean;
  featured: boolean;
  moods: string[];
  group_friendly: boolean;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

export interface PointRule {
  id: string;
  code: string;
  label: string;
  points: number;
  cooldown_hours: number;
  /** Minutes before the same user may interact with a Stop again. Separate from points eligibility. */
  interaction_cooldown_min?: number;
  max_per_location_per_week: number;
  daily_cap: number;
  weekly_cap: number;
  active: boolean;
}

export interface Hunt {
  id: string;
  island_id: string;
  region_id: string;
  name: string;
  subtitle: string;
  description: string;
  hero: string;
  category_id: string;
  completion_points: number;
  bonus_points: number;
  bonus_condition?: string;
  partner_reward_id?: string;
  starts_at: string;
  ends_at: string;
  sponsored_by?: string;
  status: 'active' | 'paused' | 'upcoming' | 'ended';
  est_minutes: number;
  group_friendly: boolean;
  featured: boolean;
}

export interface HuntStop {
  id: string;
  hunt_id: string;
  stop_id: string;
  sequence: number;
  required: boolean;
  hint: string;
}

export interface Reward {
  id: string;
  business_id: string;
  stop_id: string;
  name: string;
  description: string;
  terms: string;
  redemption_instructions: string;
  image: string;
  point_cost: number;
  category: 'food' | 'experience' | 'shopping' | 'wellness';
  quantity_total: number;
  quantity_claimed: number;
  per_user_limit: number;
  limited: boolean;
  expires_at: string;
  status: 'draft' | 'pending' | 'approved' | 'paused';
}

export interface PassportStampDef {
  id: string;
  island_id: string;
  region_id: string;
  name: string;
  requirement: string;
  stop_id?: string;
  icon: string;
}

export interface PassportMilestone {
  id: string;
  island_id: string;
  region_id?: string;
  name: string;
  stamps_required: number;
  bonus_points: number;
  badge: string;
  partner_reward_id?: string;
}

export interface AlohaDrop {
  id: string;
  stop_id: string;
  title: string;
  blurb: string;
  sponsor: string;
  starts_at: string;
  ends_at: string;
  points: number;
  reward_id?: string;
  reward_label?: string;
  quantity_total: number;
  quantity_claimed: number;
  per_user_limit: number;
  eligibility: string;
  status: 'live' | 'scheduled' | 'ended' | 'pending';
}

export interface Promotion {
  id: string;
  stop_id: string;
  title: string;
  detail: string;
  starts_at: string;
  ends_at: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

export interface Achievement {
  id: string;
  name: string;
  detail: string;
  icon: string;
  bonus_points: number;
}

// --- user-scoped records -----------------------------------------------------

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  island_id: string;
  status_label: string;
  member_since: string;
  points_balance: number;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  type: 'checkin' | 'hunt_completion' | 'passport_milestone' | 'drop' | 'promotion' | 'referral' | 'redemption' | 'admin_adjustment';
  points: number; // signed
  label: string;
  ref_id?: string;
  created_at: string;
  idempotency_key: string;
  balance_after: number;
}

export interface CheckIn {
  id: string;
  user_id: string;
  stop_id: string;
  method: 'gps' | 'qr';
  distance_m: number;
  points_awarded: number;
  created_at: string;
  device_hash: string;
  status: 'verified' | 'rejected';
  reject_reason?: string;
}

export interface UserStamp {
  id: string;
  user_id: string;
  stamp_id: string;
  earned_at: string;
}

export interface UserHuntProgress {
  id: string;
  user_id: string;
  hunt_id: string;
  started_at: string;
  completed_stop_ids: string[];
  completed_at?: string;
  status: 'in_progress' | 'completed';
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  code: string;
  created_at: string;
  expires_at: string;
  status: 'unused' | 'used' | 'expired';
  used_at?: string;
  point_cost: number;
}

export interface DropClaim {
  id: string;
  user_id: string;
  drop_id: string;
  created_at: string;
  points: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  entity_type: 'stop' | 'hunt' | 'reward' | 'adventure';
  entity_id: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  action?: { screen: string; id?: string };
}

export type NotificationChannel =
  | 'drops'
  | 'hunts'
  | 'rewards'
  | 'expirations'
  | 'passport'
  | 'promotions'
  | 'account';

export interface FraudFlag {
  id: string;
  user_label: string;
  kind: string;
  detail: string;
  risk: 'low' | 'medium' | 'high';
  created_at: string;
  status: 'open' | 'dismissed' | 'restricted';
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  created_at: string;
}

export interface PartnerSubmission {
  id: string;
  business_id: string;
  kind: 'reward' | 'promotion' | 'drop' | 'profile';
  title: string;
  submitted_at: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  note?: string;
}

export interface QrVerificationRecord {
  id: string;
  stop_id: string;
  nonce: string;
  issued_at: string;
  expires_at: string;
  consumed: boolean;
}

// --- Surprise Me -------------------------------------------------------------

export interface AdventurePrefs {
  company: 'solo' | 'partner' | 'friends' | 'family';
  budget: 0 | 25 | 50 | 100 | 999;
  minutes: 60 | 180 | 300 | 540;
  moods: string[];
  regionId?: string;
}

export interface Adventure {
  id: string;
  title: string;
  summary: string;
  stopIds: string[];
  minutes: number;
  spend: number;
  bonus_points: number;
  region_id: string;
  prefs: AdventurePrefs;
  created_at: string;
}
