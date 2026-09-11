// ---------------------------------------------------------------------------
// ALOHA HUNT — seed database (demo market: Oʻahu)
// Every record here is modelled as a database row. The admin + partner
// surfaces mutate these records at runtime and the consumer app reads from
// the same shared state, so nothing important is hard-coded in screens.
// ---------------------------------------------------------------------------
import {
  Achievement, AlohaDrop, AlohaStop, AppNotification, AuditLog, Business, Category,
  CheckIn, Destination, Favorite, FraudFlag, Hunt, HuntStop, Island, PartnerSubmission,
  PassportMilestone, PassportStampDef, PointRule, PointTransaction, Promotion, Redemption,
  Region, Reward, UserHuntProgress, UserProfile, UserStamp, NotificationChannel,
} from './types';

const IMG = {
  heroes: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152521562_6deeb8fc.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152521766_ce462a1c.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152521668_41da2e39.jpg',
  ],
  coffee: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152538015_afa94340.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152540553_5abd8bcf.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152539171_72907464.jpg',
  ],
  food: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152558469_e37e1530.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152559771_39b579d4.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152558958_3203cbdc.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152559960_b835bbc6.jpg',
  ],
  adventure: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152584118_db822d02.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152585328_c233bd31.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152591769_2e43aaf6.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152587594_70b33dec.jpg',
  ],
  market: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152608067_2fbc1e94.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152612907_2d335379.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152612283_ca2c4ec3.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152610151_f9a52b60.jpg',
  ],
  wellness: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152629720_287b06a1.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152629886_afa180f0.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152631446_42c18b77.jpg',
  ],
  dessert: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152647853_0d114013.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152648822_ef700343.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152647290_24519b58.jpg',
  ],
  banners: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152671012_13ac566c.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152671298_d31da386.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152677031_eb3b441d.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152682104_726935ea.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152676123_42010765.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152676392_8abdc8ba.jpg',
  ],
  rewards: [
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152714704_ca20b122.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152716452_de731820.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152718299_9d6c9cf9.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152716267_a607734d.jpg',
    'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152716763_1b15c3c9.jpg',
  ],
  avatar: 'https://d64gsuwffb70l.cloudfront.net/6aa44ca2f927cfcd64fddb19_1789152699012_ff46021a.jpg',
};

export const IMAGES = IMG;

// --- geography ---------------------------------------------------------------
export const destinations: Destination[] = [
  { id: 'dest_hawaii', name: 'Hawaiʻi, USA', country: 'United States' },
];

export const islands: Island[] = [
  { id: 'isl_oahu', destination_id: 'dest_hawaii', name: 'Oʻahu', slug: 'oahu', status: 'live', center: { lat: 21.45, lng: -157.97 } },
  { id: 'isl_maui', destination_id: 'dest_hawaii', name: 'Maui', slug: 'maui', status: 'coming_soon', center: { lat: 20.79, lng: -156.33 } },
  { id: 'isl_hawaii', destination_id: 'dest_hawaii', name: 'Hawaiʻi Island', slug: 'hawaii-island', status: 'coming_soon', center: { lat: 19.6, lng: -155.5 } },
  { id: 'isl_kauai', destination_id: 'dest_hawaii', name: 'Kauaʻi', slug: 'kauai', status: 'coming_soon', center: { lat: 22.05, lng: -159.5 } },
];

export const regions: Region[] = [
  { id: 'rg_honolulu', island_id: 'isl_oahu', name: 'Honolulu', blurb: 'City energy, markets and modern local kitchens.', center: { lat: 21.3069, lng: -157.8583 } },
  { id: 'rg_waikiki', island_id: 'isl_oahu', name: 'Waikīkī', blurb: 'Shoreline strolls, coffee, sunsets and shave ice.', center: { lat: 21.2765, lng: -157.8275 } },
  { id: 'rg_east', island_id: 'isl_oahu', name: 'East Oʻahu', blurb: 'Lookouts, tide pools and coastal drives.', center: { lat: 21.2934, lng: -157.6905 } },
  { id: 'rg_windward', island_id: 'isl_oahu', name: 'Windward Oʻahu', blurb: 'Emerald cliffs, calm bays and small-town charm.', center: { lat: 21.4022, lng: -157.7394 } },
  { id: 'rg_central', island_id: 'isl_oahu', name: 'Central Oʻahu', blurb: 'Plantation history, pineapple fields and valleys.', center: { lat: 21.4986, lng: -158.0286 } },
  { id: 'rg_west', island_id: 'isl_oahu', name: 'West Oʻahu', blurb: 'Lagoons, sunsets and quiet leeward coast.', center: { lat: 21.3469, lng: -158.1219 } },
  { id: 'rg_north', island_id: 'isl_oahu', name: 'North Shore', blurb: 'Legendary surf, food trucks and country roads.', center: { lat: 21.6, lng: -158.09 } },
];

export const categories: Category[] = [
  { id: 'cat_food', name: 'Food', icon: 'UtensilsCrossed', color: '#FF6F59' },
  { id: 'cat_coffee', name: 'Coffee', icon: 'Coffee', color: '#B4693C' },
  { id: 'cat_dessert', name: 'Dessert', icon: 'IceCream2', color: '#F2757A' },
  { id: 'cat_activities', name: 'Activities', icon: 'Waves', color: '#1FA9A3' },
  { id: 'cat_tours', name: 'Tours', icon: 'Compass', color: '#0B4F6C' },
  { id: 'cat_attractions', name: 'Attractions', icon: 'Mountain', color: '#2F855A' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#D4A853' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Music', color: '#7C5CBF' },
  { id: 'cat_wellness', name: 'Wellness', icon: 'Flower2', color: '#5BA88A' },
];

// --- point rules (admin configurable) ---------------------------------------
export const pointRules: PointRule[] = [
  { id: 'pr_visit_standard', code: 'VISIT_STANDARD', label: 'Verified Aloha Stop visit', points: 100, cooldown_hours: 24, interaction_cooldown_min: 15, max_per_location_per_week: 3, daily_cap: 800, weekly_cap: 3500, active: true },
  { id: 'pr_visit_premium', code: 'VISIT_PREMIUM', label: 'Verified visit — featured partner', points: 150, cooldown_hours: 24, interaction_cooldown_min: 15, max_per_location_per_week: 2, daily_cap: 800, weekly_cap: 3500, active: true },
  { id: 'pr_visit_experience', code: 'VISIT_EXPERIENCE', label: 'Verified experience / tour visit', points: 250, cooldown_hours: 72, interaction_cooldown_min: 15, max_per_location_per_week: 1, daily_cap: 800, weekly_cap: 3500, active: true },
  { id: 'pr_referral', code: 'REFERRAL', label: 'Eligible referral', points: 300, cooldown_hours: 0, interaction_cooldown_min: 15, max_per_location_per_week: 99, daily_cap: 900, weekly_cap: 3000, active: true },
];

const hoursStd = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, open: '07:00', close: '18:00' }));
const hoursLate = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, open: '10:00', close: '22:00' }));
const hoursMorning = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, open: '06:00', close: '15:00' }));

// --- businesses --------------------------------------------------------------
export const businesses: Business[] = [
  { id: 'biz_brew', name: 'Island Brew House', legal_name: 'Island Brew House LLC (demo)', phone: '(808) 555-0142', email: 'aloha@islandbrewhouse.demo', website: 'islandbrewhouse.demo', instagram: '@islandbrewhouse', status: 'active', owner_user_id: 'usr_partner' },
  { id: 'biz_nsb', name: 'North Shore Bites', legal_name: 'North Shore Bites Co. (demo)', phone: '(808) 555-0188', email: 'hi@northshorebites.demo', website: 'northshorebites.demo', instagram: '@northshorebites', status: 'active', owner_user_id: 'usr_partner2' },
  { id: 'biz_kai', name: 'Kaimana Shave Ice', legal_name: 'Kaimana Sweets (demo)', phone: '(808) 555-0171', email: 'hello@kaimanashaveice.demo', website: 'kaimanashaveice.demo', instagram: '@kaimanashaveice', status: 'active', owner_user_id: 'usr_partner3' },
  { id: 'biz_pacific', name: 'Pacific Hospitality Group', legal_name: 'Pacific Hospitality Group (demo)', phone: '(808) 555-0110', email: 'team@pacifichg.demo', website: 'pacifichg.demo', instagram: '@pacifichg', status: 'active', owner_user_id: 'usr_partner4' },
  { id: 'biz_trail', name: 'Ocean Trail Adventures', legal_name: 'Ocean Trail Adventures (demo)', phone: '(808) 555-0155', email: 'book@oceantrail.demo', website: 'oceantrail.demo', instagram: '@oceantrailadv', status: 'active', owner_user_id: 'usr_partner5' },
  { id: 'biz_wind', name: 'Windward Wellness', legal_name: 'Windward Wellness Studio (demo)', phone: '(808) 555-0166', email: 'calm@windwardwellness.demo', website: 'windwardwellness.demo', instagram: '@windwardwellness', status: 'active', owner_user_id: 'usr_partner6' },
  { id: 'biz_market', name: 'Waikīkī Local Market', legal_name: 'Waikīkī Local Market (demo)', phone: '(808) 555-0133', email: 'market@waikikilocal.demo', website: 'waikikilocal.demo', instagram: '@waikikilocalmarket', status: 'active', owner_user_id: 'usr_partner7' },
];

type StopSeed = Omit<AlohaStop, 'island_id' | 'status'> & Partial<Pick<AlohaStop, 'status'>>;

const s = (v: StopSeed): AlohaStop => ({ island_id: 'isl_oahu', status: 'approved', ...v });

export const alohaStops: AlohaStop[] = [
  s({
    id: 'stp_brew', business_id: 'biz_brew', region_id: 'rg_waikiki', category_id: 'cat_coffee',
    name: 'Island Brew House', tagline: 'Single-origin Kona pours & house macadamia cold brew',
    description: 'A light-filled corner roastery two blocks from the Waikīkī shoreline. Beans are roasted on-island every Tuesday, and the shaded lānai is the neighborhood pre-sunrise meeting spot. Ask the barista about the daily pour-over flight.',
    address: '2255 Kalākaua Ave, Honolulu, HI 96815', coords: { lat: 21.2793, lng: -157.8294 },
    images: IMG.coffee, hours: hoursMorning, price_tier: 2, avg_minutes: 45, avg_spend: 9,
    rating: 4.8, review_count: 612, point_rule_id: 'pr_visit_premium', passport_stamp_id: 'stm_waikiki_coffee',
    geofence_m: 120, qr_enabled: true, featured: true, moods: ['food', 'relaxing', 'local'], group_friendly: true,
  }),
  s({
    id: 'stp_sunrise', business_id: 'biz_pacific', region_id: 'rg_waikiki', category_id: 'cat_food',
    name: 'Pacific Sunrise Café', tagline: 'Sunrise plates, lilikoʻi pancakes and ocean air',
    description: 'An all-day café built around Oʻahu farm produce. The lilikoʻi pancakes and the ahi benedict are the reason locals queue before 7am.',
    address: '134 Kapahulu Ave, Honolulu, HI 96815', coords: { lat: 21.2724, lng: -157.8203 },
    images: [IMG.food[0], IMG.food[1], IMG.coffee[1]], hours: hoursMorning, price_tier: 2, avg_minutes: 60, avg_spend: 22,
    rating: 4.7, review_count: 934, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_waikiki_breakfast',
    geofence_m: 120, qr_enabled: true, featured: true, moods: ['food', 'family', 'relaxing'], group_friendly: true,
  }),
  s({
    id: 'stp_kaimana', business_id: 'biz_kai', region_id: 'rg_waikiki', category_id: 'cat_dessert',
    name: 'Kaimana Shave Ice', tagline: 'Hand-shaved ice, real fruit syrups, no shortcuts',
    description: 'A tiny window shop with a long line and a short menu. Syrups are made from Oʻahu-grown fruit and the lilikoʻi-guava combo is the house classic.',
    address: '3045 Monsarrat Ave, Honolulu, HI 96815', coords: { lat: 21.2686, lng: -157.8159 },
    images: IMG.dessert, hours: hoursLate, price_tier: 1, avg_minutes: 25, avg_spend: 8,
    rating: 4.9, review_count: 1420, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_waikiki_sweet',
    geofence_m: 100, qr_enabled: true, featured: false, moods: ['food', 'family', 'local'], group_friendly: true,
  }),
  s({
    id: 'stp_market', business_id: 'biz_market', region_id: 'rg_waikiki', category_id: 'cat_shopping',
    name: 'Waikīkī Local Market', tagline: 'Makers, lei stands and island-made gifts',
    description: 'An open-air market of 40+ Oʻahu makers — ceramics, lauhala weaving, small-batch honey and locally printed textiles.',
    address: '2201 Kalākaua Ave, Honolulu, HI 96815', coords: { lat: 21.2781, lng: -157.8265 },
    images: IMG.market, hours: hoursLate, price_tier: 2, avg_minutes: 50, avg_spend: 30,
    rating: 4.6, review_count: 388, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_waikiki_market',
    geofence_m: 150, qr_enabled: true, featured: false, moods: ['shopping', 'local', 'relaxing'], group_friendly: true,
  }),
  s({
    id: 'stp_diamond', business_id: 'biz_trail', region_id: 'rg_waikiki', category_id: 'cat_attractions',
    name: 'Diamond View Experience', tagline: 'Guided crater rim walk with a sunrise window',
    description: 'A 75-minute guided rim walk with an interpretive guide covering geology, history and the best light of the day.',
    address: 'Diamond Head Rd, Honolulu, HI 96815', coords: { lat: 21.2619, lng: -157.8056 },
    images: [IMG.adventure[1], IMG.banners[2], IMG.adventure[3]], hours: hoursMorning, price_tier: 2, avg_minutes: 90, avg_spend: 25,
    rating: 4.8, review_count: 512, point_rule_id: 'pr_visit_experience', passport_stamp_id: 'stm_waikiki_crater',
    geofence_m: 200, qr_enabled: false, featured: true, moods: ['adventure', 'outdoors', 'romantic'], group_friendly: true,
  }),
  s({
    id: 'stp_kitchen', business_id: 'biz_pacific', region_id: 'rg_honolulu', category_id: 'cat_food',
    name: 'Pacific Local Kitchen', tagline: 'Modern plate lunch, island-farmed',
    description: 'Chef-driven takes on the plate lunch: kālua pork with kimchi rice, garlic ʻahi, and a rotating vegetarian bowl.',
    address: '1146 Bethel St, Honolulu, HI 96813', coords: { lat: 21.3096, lng: -157.8606 },
    images: [IMG.food[2], IMG.food[3], IMG.market[1]], hours: hoursStd, price_tier: 2, avg_minutes: 60, avg_spend: 26,
    rating: 4.7, review_count: 721, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_hono_kitchen',
    geofence_m: 120, qr_enabled: true, featured: true, moods: ['food', 'local'], group_friendly: true,
  }),
  s({
    id: 'stp_chinatown', business_id: 'biz_market', region_id: 'rg_honolulu', category_id: 'cat_shopping',
    name: 'Chinatown Arts Walk', tagline: 'Galleries, murals and a printmaking studio',
    description: 'A self-guided loop through seven galleries and two open studios in historic Chinatown. Best on the first Friday of the month.',
    address: '1160 Nuʻuanu Ave, Honolulu, HI 96817', coords: { lat: 21.3121, lng: -157.8632 },
    images: [IMG.market[2], IMG.market[3], IMG.market[0]], hours: hoursLate, price_tier: 1, avg_minutes: 70, avg_spend: 12,
    rating: 4.5, review_count: 240, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_hono_arts',
    geofence_m: 180, qr_enabled: false, featured: false, moods: ['local', 'entertainment', 'shopping'], group_friendly: true,
  }),
  s({
    id: 'stp_harbor', business_id: 'biz_trail', region_id: 'rg_honolulu', category_id: 'cat_entertainment',
    name: 'Harbor Lights Live', tagline: 'Sunset slack-key sets on the waterfront',
    description: 'Nightly slack-key and ukulele sets on a converted harbor pier, with a small local-food lineup and no cover charge before 6pm.',
    address: '1 Aloha Tower Dr, Honolulu, HI 96813', coords: { lat: 21.3062, lng: -157.8666 },
    images: [IMG.banners[4], IMG.banners[0], IMG.adventure[0]], hours: hoursLate, price_tier: 2, avg_minutes: 90, avg_spend: 35,
    rating: 4.6, review_count: 305, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_hono_music',
    geofence_m: 150, qr_enabled: true, featured: false, moods: ['entertainment', 'romantic', 'local'], group_friendly: true,
  }),
  s({
    id: 'stp_lookout', business_id: 'biz_trail', region_id: 'rg_east', category_id: 'cat_attractions',
    name: 'Makapuʻu Ridge Lookout', tagline: 'Whale-season lookout with paved ridge access',
    description: 'A paved 2-mile out-and-back to the most photographed lookout on the east side. Winter mornings bring humpback sightings.',
    address: 'Kalanianaʻole Hwy, Waimānalo, HI 96795', coords: { lat: 21.3103, lng: -157.6534 },
    images: [IMG.adventure[2], IMG.banners[1], IMG.adventure[0]], hours: hoursMorning, price_tier: 1, avg_minutes: 80, avg_spend: 0,
    rating: 4.9, review_count: 880, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_east_lookout',
    geofence_m: 250, qr_enabled: false, featured: true, moods: ['outdoors', 'adventure', 'free'], group_friendly: true,
  }),
  s({
    id: 'stp_tide', business_id: 'biz_trail', region_id: 'rg_east', category_id: 'cat_tours',
    name: 'Koko Tide Pool Tour', tagline: 'Guided reef-safe tide pool walk',
    description: 'A marine-educator-led tide pool walk covering reef safety, native species and the volcanic geology of the southeast shore.',
    address: '7590 Kalanianaʻole Hwy, Honolulu, HI 96825', coords: { lat: 21.2795, lng: -157.6866 },
    images: [IMG.adventure[3], IMG.wellness[2], IMG.adventure[1]], hours: hoursMorning, price_tier: 2, avg_minutes: 100, avg_spend: 45,
    rating: 4.7, review_count: 196, point_rule_id: 'pr_visit_experience', passport_stamp_id: 'stm_east_tide',
    geofence_m: 200, qr_enabled: true, featured: false, moods: ['adventure', 'outdoors', 'family'], group_friendly: true,
  }),
  s({
    id: 'stp_wind', business_id: 'biz_wind', region_id: 'rg_windward', category_id: 'cat_wellness',
    name: 'Windward Wellness', tagline: 'Ocean-deck yoga, lomi massage, cold plunge',
    description: 'A calm studio on the Kailua side with sunrise deck flows, traditional lomilomi appointments and a small cold-plunge courtyard.',
    address: '629 Kailua Rd, Kailua, HI 96734', coords: { lat: 21.3924, lng: -157.7401 },
    images: IMG.wellness, hours: hoursStd, price_tier: 3, avg_minutes: 75, avg_spend: 48,
    rating: 4.9, review_count: 268, point_rule_id: 'pr_visit_premium', passport_stamp_id: 'stm_wind_wellness',
    geofence_m: 120, qr_enabled: true, featured: true, moods: ['relaxing', 'wellness', 'romantic'], group_friendly: false,
  }),
  s({
    id: 'stp_kualoa', business_id: 'biz_trail', region_id: 'rg_windward', category_id: 'cat_activities',
    name: 'Windward Kayak Co.', tagline: 'Guided paddle to the sandbar',
    description: 'Small-group guided paddles across the calm bay, including a sandbar stop and reef-safe snorkeling gear.',
    address: '49-560 Kamehameha Hwy, Kāneʻohe, HI 96744', coords: { lat: 21.5109, lng: -157.8382 },
    images: [IMG.adventure[0], IMG.adventure[2], IMG.banners[3]], hours: hoursMorning, price_tier: 3, avg_minutes: 180, avg_spend: 89,
    rating: 4.8, review_count: 342, point_rule_id: 'pr_visit_experience', passport_stamp_id: 'stm_wind_kayak',
    geofence_m: 200, qr_enabled: true, featured: false, moods: ['adventure', 'outdoors', 'friends'], group_friendly: true,
  }),
  s({
    id: 'stp_kahuku', business_id: 'biz_nsb', region_id: 'rg_north', category_id: 'cat_food',
    name: 'Kahuku Garlic Shrimp Truck', tagline: 'Twelve cloves, one plate, zero regrets',
    description: 'The original roadside truck on the Kahuku stretch. Garlic butter shrimp, two-scoop rice, macaroni salad — cash and app-pay only.',
    address: '56-565 Kamehameha Hwy, Kahuku, HI 96731', coords: { lat: 21.6768, lng: -157.9505 },
    images: [IMG.food[1], IMG.food[0], IMG.banners[5]], hours: hoursStd, price_tier: 1, avg_minutes: 45, avg_spend: 18,
    rating: 4.8, review_count: 1580, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_north_shrimp',
    geofence_m: 150, qr_enabled: true, featured: true, moods: ['food', 'local', 'family'], group_friendly: true,
  }),
  s({
    id: 'stp_nsb', business_id: 'biz_nsb', region_id: 'rg_north', category_id: 'cat_food',
    name: 'North Shore Bites', tagline: 'Poke bowls, açaí and haupia malasadas',
    description: 'A surf-town counter shop between Haleʻiwa and Waimea with the freshest poke on the north side and a shaded picnic yard.',
    address: '66-250 Kamehameha Hwy, Haleʻiwa, HI 96712', coords: { lat: 21.5934, lng: -158.1035 },
    images: [IMG.food[3], IMG.food[2], IMG.market[3]], hours: hoursStd, price_tier: 2, avg_minutes: 50, avg_spend: 21,
    rating: 4.7, review_count: 967, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_north_bites',
    geofence_m: 120, qr_enabled: true, featured: true, moods: ['food', 'local', 'friends'], group_friendly: true,
  }),
  s({
    id: 'stp_surf', business_id: 'biz_trail', region_id: 'rg_north', category_id: 'cat_activities',
    name: 'Sunset Surf Experience', tagline: 'Beginner-friendly lessons on a forgiving break',
    description: 'Two-hour small-group lessons with certified instructors, soft-top boards and a photo set included.',
    address: '59-144 Kamehameha Hwy, Haleʻiwa, HI 96712', coords: { lat: 21.6741, lng: -158.0403 },
    images: [IMG.adventure[1], IMG.adventure[3], IMG.banners[0]], hours: hoursMorning, price_tier: 3, avg_minutes: 150, avg_spend: 95,
    rating: 4.9, review_count: 430, point_rule_id: 'pr_visit_experience', passport_stamp_id: 'stm_north_surf',
    geofence_m: 250, qr_enabled: true, featured: true, moods: ['adventure', 'outdoors', 'friends'], group_friendly: true,
  }),
  s({
    id: 'stp_waimea', business_id: 'biz_trail', region_id: 'rg_north', category_id: 'cat_attractions',
    name: 'Waimea Valley Gardens', tagline: 'Botanical valley walk to a waterfall',
    description: 'A cultivated valley of native and Polynesian-introduced plants, ending at a swimmable waterfall pool with lifeguards on duty.',
    address: '59-864 Kamehameha Hwy, Haleʻiwa, HI 96712', coords: { lat: 21.6385, lng: -158.0602 },
    images: [IMG.wellness[1], IMG.adventure[2], IMG.banners[2]], hours: hoursStd, price_tier: 2, avg_minutes: 120, avg_spend: 25,
    rating: 4.8, review_count: 744, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_north_valley',
    geofence_m: 250, qr_enabled: false, featured: false, moods: ['outdoors', 'family', 'relaxing'], group_friendly: true,
  }),
  s({
    id: 'stp_pineapple', business_id: 'biz_market', region_id: 'rg_central', category_id: 'cat_attractions',
    name: 'Central Pineapple Fields', tagline: 'Plantation history and a soft-serve worth the drive',
    description: 'A working demonstration field with a short interpretive loop, a maze and legendary pineapple soft-serve.',
    address: '64-1550 Kamehameha Hwy, Wahiawā, HI 96786', coords: { lat: 21.5257, lng: -158.0362 },
    images: [IMG.market[0], IMG.dessert[1], IMG.banners[3]], hours: hoursStd, price_tier: 1, avg_minutes: 75, avg_spend: 14,
    rating: 4.4, review_count: 1210, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_central_field',
    geofence_m: 250, qr_enabled: true, featured: false, moods: ['family', 'local', 'outdoors'], group_friendly: true,
  }),
  s({
    id: 'stp_wahiawa', business_id: 'biz_brew', region_id: 'rg_central', category_id: 'cat_coffee',
    name: 'Plantation Coffee Room', tagline: 'Slow bar in an old plantation storefront',
    description: 'A restored 1930s storefront pouring Oʻahu-grown coffee with a rotating single-origin flight and taro scones.',
    address: '102 California Ave, Wahiawā, HI 96786', coords: { lat: 21.5019, lng: -158.0304 },
    images: [IMG.coffee[2], IMG.coffee[0], IMG.market[2]], hours: hoursMorning, price_tier: 2, avg_minutes: 40, avg_spend: 11,
    rating: 4.6, review_count: 289, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_central_coffee',
    geofence_m: 120, qr_enabled: true, featured: false, moods: ['food', 'relaxing', 'local'], group_friendly: true,
  }),
  s({
    id: 'stp_lagoon', business_id: 'biz_pacific', region_id: 'rg_west', category_id: 'cat_activities',
    name: 'Leeward Lagoon Club', tagline: 'Calm-water lagoon day passes & paddleboards',
    description: 'Family-friendly lagoon access with paddleboard rental, shaded cabanas and a sunset grill window.',
    address: '92-1001 Oliʻoli St, Kapolei, HI 96707', coords: { lat: 21.3349, lng: -158.1226 },
    images: [IMG.adventure[0], IMG.wellness[0], IMG.banners[1]], hours: hoursStd, price_tier: 2, avg_minutes: 180, avg_spend: 40,
    rating: 4.6, review_count: 421, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_west_lagoon',
    geofence_m: 200, qr_enabled: true, featured: true, moods: ['family', 'relaxing', 'outdoors'], group_friendly: true,
  }),
  s({
    id: 'stp_sunsetgrill', business_id: 'biz_nsb', region_id: 'rg_west', category_id: 'cat_food',
    name: 'Leeward Sunset Grill', tagline: 'Grilled catch of the day at the water line',
    description: 'An open-air grill on the leeward shore with the best sunset seats on the island and a short, fresh menu.',
    address: '85-955 Farrington Hwy, Waiʻanae, HI 96792', coords: { lat: 21.4375, lng: -158.1925 },
    images: [IMG.food[0], IMG.banners[4], IMG.food[2]], hours: hoursLate, price_tier: 2, avg_minutes: 80, avg_spend: 34,
    rating: 4.5, review_count: 356, point_rule_id: 'pr_visit_standard', passport_stamp_id: 'stm_west_grill',
    geofence_m: 150, qr_enabled: true, featured: false, moods: ['food', 'romantic', 'local'], group_friendly: true,
  }),
];

// --- hunts -------------------------------------------------------------------
export const hunts: Hunt[] = [
  {
    id: 'hnt_north_food', island_id: 'isl_oahu', region_id: 'rg_north', name: 'North Shore Food Hunt',
    subtitle: 'Three legendary country stops', description: 'Drive the country loop and eat your way through the north side. Visit three participating Aloha Stops in any order to complete the hunt.',
    hero: IMG.banners[0], category_id: 'cat_food', completion_points: 1000, bonus_points: 250,
    bonus_condition: 'Finish all three stops within 24 hours', starts_at: '2026-06-01T00:00:00Z', ends_at: '2026-12-31T23:59:00Z',
    status: 'active', est_minutes: 240, group_friendly: true, featured: true,
  },
  {
    id: 'hnt_waikiki_sunset', island_id: 'isl_oahu', region_id: 'rg_waikiki', name: 'Waikīkī Food & Sunset Hunt',
    subtitle: 'Coffee, market, dessert, golden hour', description: 'A walkable Waikīkī loop built for late afternoon: start with coffee, browse island makers, end with shave ice as the sun drops.',
    hero: IMG.banners[1], category_id: 'cat_food', completion_points: 750, bonus_points: 150,
    bonus_condition: 'Check in to the final stop after 5:00 PM', starts_at: '2026-05-01T00:00:00Z', ends_at: '2026-12-31T23:59:00Z',
    status: 'active', est_minutes: 180, group_friendly: true, featured: true,
  },
  {
    id: 'hnt_windward_wellness', island_id: 'isl_oahu', region_id: 'rg_windward', name: 'Windward Wellness Hunt',
    subtitle: 'Reset on the windward side', description: 'Sunrise deck flow, a calm-water paddle and a slow lunch. Built for a restorative half day.',
    hero: IMG.wellness[0], category_id: 'cat_wellness', completion_points: 900, bonus_points: 0,
    starts_at: '2026-07-01T00:00:00Z', ends_at: '2026-12-31T23:59:00Z', status: 'active',
    est_minutes: 300, group_friendly: false, featured: false, sponsored_by: 'Windward Wellness',
  },
  {
    id: 'hnt_east_coast', island_id: 'isl_oahu', region_id: 'rg_east', name: 'East Side Lookout Hunt',
    subtitle: 'Ridge views and tide pools', description: 'Two of the best coastal viewpoints on Oʻahu plus a guided tide pool walk.',
    hero: IMG.adventure[2], category_id: 'cat_attractions', completion_points: 600, bonus_points: 100,
    starts_at: '2026-04-01T00:00:00Z', ends_at: '2026-12-31T23:59:00Z', status: 'active',
    est_minutes: 210, group_friendly: true, featured: false,
  },
  {
    id: 'hnt_honolulu_makers', island_id: 'isl_oahu', region_id: 'rg_honolulu', name: 'Honolulu Makers Hunt',
    subtitle: 'Galleries, kitchens and live music', description: 'A downtown evening loop through the arts walk, a modern plate-lunch kitchen and a harbor-side music set.',
    hero: IMG.market[2], category_id: 'cat_entertainment', completion_points: 800, bonus_points: 0,
    starts_at: '2026-08-01T00:00:00Z', ends_at: '2026-12-31T23:59:00Z', status: 'active',
    est_minutes: 240, group_friendly: true, featured: false, sponsored_by: 'Pacific Hospitality Group',
  },
  {
    id: 'hnt_island_loop', island_id: 'isl_oahu', region_id: 'rg_central', name: 'Full Island Loop Hunt',
    subtitle: 'Five regions, one long day', description: 'The flagship Oʻahu circuit. Five regions, five stops, one very good day. Opens island-wide next month.',
    hero: IMG.banners[3], category_id: 'cat_tours', completion_points: 2500, bonus_points: 500,
    starts_at: '2026-10-01T00:00:00Z', ends_at: '2027-03-31T23:59:00Z', status: 'upcoming',
    est_minutes: 540, group_friendly: true, featured: true,
  },
];

export const huntStops: HuntStop[] = [
  { id: 'hs_1', hunt_id: 'hnt_north_food', stop_id: 'stp_nsb', sequence: 1, required: true, hint: 'Start with a poke bowl in Haleʻiwa town.' },
  { id: 'hs_2', hunt_id: 'hnt_north_food', stop_id: 'stp_kahuku', sequence: 2, required: true, hint: 'Follow the highway north to the shrimp trucks.' },
  { id: 'hs_3', hunt_id: 'hnt_north_food', stop_id: 'stp_waimea', sequence: 3, required: true, hint: 'Walk it off in the valley before heading back.' },
  { id: 'hs_4', hunt_id: 'hnt_waikiki_sunset', stop_id: 'stp_brew', sequence: 1, required: true, hint: 'Caffeinate first — ask for the pour-over flight.' },
  { id: 'hs_5', hunt_id: 'hnt_waikiki_sunset', stop_id: 'stp_market', sequence: 2, required: true, hint: 'Find something made on-island.' },
  { id: 'hs_6', hunt_id: 'hnt_waikiki_sunset', stop_id: 'stp_kaimana', sequence: 3, required: true, hint: 'Dessert before sunset.' },
  { id: 'hs_7', hunt_id: 'hnt_waikiki_sunset', stop_id: 'stp_diamond', sequence: 4, required: false, hint: 'Bonus: catch the light from the crater rim.' },
  { id: 'hs_8', hunt_id: 'hnt_windward_wellness', stop_id: 'stp_wind', sequence: 1, required: true, hint: 'Sunrise deck flow.' },
  { id: 'hs_9', hunt_id: 'hnt_windward_wellness', stop_id: 'stp_kualoa', sequence: 2, required: true, hint: 'Paddle the calm bay.' },
  { id: 'hs_10', hunt_id: 'hnt_east_coast', stop_id: 'stp_lookout', sequence: 1, required: true, hint: 'Ridge first, before the heat.' },
  { id: 'hs_11', hunt_id: 'hnt_east_coast', stop_id: 'stp_tide', sequence: 2, required: true, hint: 'Low tide is the good tide.' },
  { id: 'hs_12', hunt_id: 'hnt_honolulu_makers', stop_id: 'stp_chinatown', sequence: 1, required: true, hint: 'Start at the printmaking studio.' },
  { id: 'hs_13', hunt_id: 'hnt_honolulu_makers', stop_id: 'stp_kitchen', sequence: 2, required: true, hint: 'Kālua pork, kimchi rice.' },
  { id: 'hs_14', hunt_id: 'hnt_honolulu_makers', stop_id: 'stp_harbor', sequence: 3, required: true, hint: 'Slack-key set at golden hour.' },
  { id: 'hs_15', hunt_id: 'hnt_island_loop', stop_id: 'stp_pineapple', sequence: 1, required: true, hint: 'Central first.' },
  { id: 'hs_16', hunt_id: 'hnt_island_loop', stop_id: 'stp_surf', sequence: 2, required: true, hint: 'North Shore water time.' },
  { id: 'hs_17', hunt_id: 'hnt_island_loop', stop_id: 'stp_kualoa', sequence: 3, required: true, hint: 'Windward paddle.' },
  { id: 'hs_18', hunt_id: 'hnt_island_loop', stop_id: 'stp_lookout', sequence: 4, required: true, hint: 'East side ridge.' },
  { id: 'hs_19', hunt_id: 'hnt_island_loop', stop_id: 'stp_kaimana', sequence: 5, required: true, hint: 'Finish sweet in Waikīkī.' },
];

// --- rewards -----------------------------------------------------------------
export const rewards: Reward[] = [
  { id: 'rwd_coffee', business_id: 'biz_brew', stop_id: 'stp_brew', name: 'Free Signature Coffee', description: 'Any 12oz signature pour-over or house macadamia cold brew, on the house.', terms: 'One per member per 30 days. Not combinable with other offers. No cash value.', redemption_instructions: 'Show this code at the register before ordering. Staff taps “Mark as Used”.', image: IMG.rewards[0], point_cost: 500, category: 'food', quantity_total: 250, quantity_claimed: 118, per_user_limit: 1, limited: false, expires_at: '2026-12-31T23:59:00Z', status: 'approved' },
  { id: 'rwd_shaveice', business_id: 'biz_kai', stop_id: 'stp_kaimana', name: 'Large Shave Ice, Any Syrup', description: 'A large hand-shaved ice with up to three house fruit syrups.', terms: 'One per member per 14 days. No cash value.', redemption_instructions: 'Show the code at the window.', image: IMG.dessert[0], point_cost: 450, category: 'food', quantity_total: 400, quantity_claimed: 212, per_user_limit: 2, limited: false, expires_at: '2026-12-31T23:59:00Z', status: 'approved' },
  { id: 'rwd_poke', business_id: 'biz_nsb', stop_id: 'stp_nsb', name: 'Poke Bowl Upgrade', description: 'Upgrade any regular poke bowl to a large, plus a lilikoʻi soda.', terms: 'Dine-in or takeaway. One per member per week.', redemption_instructions: 'Present code at the counter when ordering.', image: IMG.food[3], point_cost: 700, category: 'food', quantity_total: 300, quantity_claimed: 96, per_user_limit: 1, limited: false, expires_at: '2026-12-31T23:59:00Z', status: 'approved' },
  { id: 'rwd_surf', business_id: 'biz_trail', stop_id: 'stp_surf', name: '$40 Off a Surf Lesson', description: 'Forty dollars off any two-hour beginner group lesson at Sunset Surf Experience.', terms: 'Advance booking required. Subject to conditions and instructor availability.', redemption_instructions: 'Give the code when booking by phone or at the beach hut.', image: IMG.adventure[1], point_cost: 2000, category: 'experience', quantity_total: 60, quantity_claimed: 41, per_user_limit: 1, limited: true, expires_at: '2026-11-30T23:59:00Z', status: 'approved' },
  { id: 'rwd_kayak', business_id: 'biz_trail', stop_id: 'stp_kualoa', name: 'Guided Sandbar Paddle — 2 for 1', description: 'Bring a friend free on any morning guided sandbar paddle.', terms: 'Weekdays only. Weather dependent.', redemption_instructions: 'Present code at the Kāneʻohe launch desk.', image: IMG.adventure[0], point_cost: 2400, category: 'experience', quantity_total: 40, quantity_claimed: 28, per_user_limit: 1, limited: true, expires_at: '2026-10-31T23:59:00Z', status: 'approved' },
  { id: 'rwd_lomi', business_id: 'biz_wind', stop_id: 'stp_wind', name: '30-Minute Lomilomi Session', description: 'A complimentary 30-minute traditional lomilomi session with a licensed practitioner.', terms: 'Appointment required. 24-hour cancellation policy.', redemption_instructions: 'Provide the code when booking your appointment.', image: IMG.wellness[0], point_cost: 3000, category: 'wellness', quantity_total: 25, quantity_claimed: 19, per_user_limit: 1, limited: true, expires_at: '2026-10-15T23:59:00Z', status: 'approved' },
  { id: 'rwd_market', business_id: 'biz_market', stop_id: 'stp_market', name: '$15 Island Maker Credit', description: 'Fifteen dollars of credit with any participating maker at Waikīkī Local Market.', terms: 'Single transaction. No change given. No cash value.', redemption_instructions: 'Show code to the market host to receive a validated voucher.', image: IMG.market[1], point_cost: 900, category: 'shopping', quantity_total: 200, quantity_claimed: 64, per_user_limit: 2, limited: false, expires_at: '2026-12-31T23:59:00Z', status: 'approved' },
  { id: 'rwd_tote', business_id: 'biz_market', stop_id: 'stp_market', name: 'Limited Aloha Hunt Tote', description: 'Screen-printed canvas tote by an Oʻahu print studio. Numbered run of 100.', terms: 'While supplies last. In-person pickup only.', redemption_instructions: 'Collect at the market host stand with your code.', image: IMG.market[3], point_cost: 1200, category: 'shopping', quantity_total: 100, quantity_claimed: 97, per_user_limit: 1, limited: true, expires_at: '2026-09-30T23:59:00Z', status: 'approved' },
  { id: 'rwd_brunch', business_id: 'biz_pacific', stop_id: 'stp_sunrise', name: 'Lilikoʻi Pancake Stack', description: 'A full stack of the house lilikoʻi pancakes with whipped haupia butter.', terms: 'Before 11am. One per member per week.', redemption_instructions: 'Show the code to your server.', image: IMG.food[1], point_cost: 650, category: 'food', quantity_total: 220, quantity_claimed: 74, per_user_limit: 1, limited: false, expires_at: '2026-12-31T23:59:00Z', status: 'approved' },
  { id: 'rwd_crater', business_id: 'biz_trail', stop_id: 'stp_diamond', name: 'Guided Crater Walk for Two', description: 'Two spots on the guided Diamond View rim walk, including the sunrise window.', terms: 'Reservation required, 48 hours notice.', redemption_instructions: 'Provide code when reserving.', image: IMG.adventure[3], point_cost: 1800, category: 'experience', quantity_total: 50, quantity_claimed: 50, per_user_limit: 1, limited: true, expires_at: '2026-12-01T23:59:00Z', status: 'approved' },
  { id: 'rwd_grill', business_id: 'biz_nsb', stop_id: 'stp_sunsetgrill', name: 'Sunset Grill — Catch of the Day', description: 'One grilled catch-of-the-day plate at the leeward sunset grill.', terms: 'Subject to daily catch availability.', redemption_instructions: 'Show the code at the order window.', image: IMG.food[0], point_cost: 1500, category: 'food', quantity_total: 120, quantity_claimed: 33, per_user_limit: 1, limited: false, expires_at: '2026-12-31T23:59:00Z', status: 'approved' },
  { id: 'rwd_lagoon', business_id: 'biz_pacific', stop_id: 'stp_lagoon', name: 'Lagoon Day Pass + Paddleboard', description: 'A full lagoon day pass with a two-hour paddleboard rental.', terms: 'Weather dependent. Ages 8+.', redemption_instructions: 'Present code at the cabana desk.', image: IMG.wellness[2], point_cost: 2200, category: 'experience', quantity_total: 80, quantity_claimed: 22, per_user_limit: 1, limited: false, expires_at: '2026-12-31T23:59:00Z', status: 'approved' },
];

// --- passport ----------------------------------------------------------------
export const passportStamps: PassportStampDef[] = [
  { id: 'stm_waikiki_coffee', island_id: 'isl_oahu', region_id: 'rg_waikiki', name: 'Waikīkī Coffee', requirement: 'Verified visit to Island Brew House', stop_id: 'stp_brew', icon: 'Coffee' },
  { id: 'stm_waikiki_breakfast', island_id: 'isl_oahu', region_id: 'rg_waikiki', name: 'Sunrise Plate', requirement: 'Verified visit to Pacific Sunrise Café', stop_id: 'stp_sunrise', icon: 'Sunrise' },
  { id: 'stm_waikiki_sweet', island_id: 'isl_oahu', region_id: 'rg_waikiki', name: 'Shave Ice', requirement: 'Verified visit to Kaimana Shave Ice', stop_id: 'stp_kaimana', icon: 'IceCream2' },
  { id: 'stm_waikiki_market', island_id: 'isl_oahu', region_id: 'rg_waikiki', name: 'Island Makers', requirement: 'Verified visit to Waikīkī Local Market', stop_id: 'stp_market', icon: 'ShoppingBag' },
  { id: 'stm_waikiki_crater', island_id: 'isl_oahu', region_id: 'rg_waikiki', name: 'Crater Rim', requirement: 'Verified visit to Diamond View Experience', stop_id: 'stp_diamond', icon: 'Mountain' },
  { id: 'stm_hono_kitchen', island_id: 'isl_oahu', region_id: 'rg_honolulu', name: 'Plate Lunch', requirement: 'Verified visit to Pacific Local Kitchen', stop_id: 'stp_kitchen', icon: 'UtensilsCrossed' },
  { id: 'stm_hono_arts', island_id: 'isl_oahu', region_id: 'rg_honolulu', name: 'Arts Walk', requirement: 'Verified visit to Chinatown Arts Walk', stop_id: 'stp_chinatown', icon: 'Palette' },
  { id: 'stm_hono_music', island_id: 'isl_oahu', region_id: 'rg_honolulu', name: 'Harbor Lights', requirement: 'Verified visit to Harbor Lights Live', stop_id: 'stp_harbor', icon: 'Music' },
  { id: 'stm_hono_night', island_id: 'isl_oahu', region_id: 'rg_honolulu', name: 'City Night', requirement: 'Two Honolulu visits after 6:00 PM', icon: 'Moon' },
  { id: 'stm_east_lookout', island_id: 'isl_oahu', region_id: 'rg_east', name: 'Ridge Lookout', requirement: 'Verified visit to Makapuʻu Ridge Lookout', stop_id: 'stp_lookout', icon: 'Binoculars' },
  { id: 'stm_east_tide', island_id: 'isl_oahu', region_id: 'rg_east', name: 'Tide Pools', requirement: 'Verified visit to Koko Tide Pool Tour', stop_id: 'stp_tide', icon: 'Shell' },
  { id: 'stm_east_sunrise', island_id: 'isl_oahu', region_id: 'rg_east', name: 'East Sunrise', requirement: 'Any East Oʻahu visit before 7:00 AM', icon: 'Sunrise' },
  { id: 'stm_wind_wellness', island_id: 'isl_oahu', region_id: 'rg_windward', name: 'Windward Calm', requirement: 'Verified visit to Windward Wellness', stop_id: 'stp_wind', icon: 'Flower2' },
  { id: 'stm_wind_kayak', island_id: 'isl_oahu', region_id: 'rg_windward', name: 'Sandbar Paddle', requirement: 'Verified visit to Windward Kayak Co.', stop_id: 'stp_kualoa', icon: 'Waves' },
  { id: 'stm_wind_bay', island_id: 'isl_oahu', region_id: 'rg_windward', name: 'Bay Explorer', requirement: 'Two windward visits in one week', icon: 'Sailboat' },
  { id: 'stm_central_field', island_id: 'isl_oahu', region_id: 'rg_central', name: 'Pineapple Fields', requirement: 'Verified visit to Central Pineapple Fields', stop_id: 'stp_pineapple', icon: 'Sprout' },
  { id: 'stm_central_coffee', island_id: 'isl_oahu', region_id: 'rg_central', name: 'Plantation Pour', requirement: 'Verified visit to Plantation Coffee Room', stop_id: 'stp_wahiawa', icon: 'Coffee' },
  { id: 'stm_central_valley', island_id: 'isl_oahu', region_id: 'rg_central', name: 'Valley Roads', requirement: 'Complete any Central Oʻahu hunt', icon: 'Route' },
  { id: 'stm_west_lagoon', island_id: 'isl_oahu', region_id: 'rg_west', name: 'Leeward Lagoon', requirement: 'Verified visit to Leeward Lagoon Club', stop_id: 'stp_lagoon', icon: 'Umbrella' },
  { id: 'stm_west_grill', island_id: 'isl_oahu', region_id: 'rg_west', name: 'Leeward Sunset', requirement: 'Verified visit to Leeward Sunset Grill', stop_id: 'stp_sunsetgrill', icon: 'Sunset' },
  { id: 'stm_west_coast', island_id: 'isl_oahu', region_id: 'rg_west', name: 'West Coast Drive', requirement: 'Two West Oʻahu visits', icon: 'Car' },
  { id: 'stm_north_shrimp', island_id: 'isl_oahu', region_id: 'rg_north', name: 'Garlic Shrimp', requirement: 'Verified visit to Kahuku Garlic Shrimp Truck', stop_id: 'stp_kahuku', icon: 'UtensilsCrossed' },
  { id: 'stm_north_bites', island_id: 'isl_oahu', region_id: 'rg_north', name: 'Country Poke', requirement: 'Verified visit to North Shore Bites', stop_id: 'stp_nsb', icon: 'Fish' },
  { id: 'stm_north_surf', island_id: 'isl_oahu', region_id: 'rg_north', name: 'First Wave', requirement: 'Verified visit to Sunset Surf Experience', stop_id: 'stp_surf', icon: 'Waves' },
  { id: 'stm_north_valley', island_id: 'isl_oahu', region_id: 'rg_north', name: 'Waimea Valley', requirement: 'Verified visit to Waimea Valley Gardens', stop_id: 'stp_waimea', icon: 'Trees' },
  { id: 'stm_north_loop', island_id: 'isl_oahu', region_id: 'rg_north', name: 'Country Loop', requirement: 'Complete the North Shore Food Hunt', icon: 'Route' },
  { id: 'stm_north_sunset', island_id: 'isl_oahu', region_id: 'rg_north', name: 'North Sunset', requirement: 'Any North Shore visit after 6:00 PM', icon: 'Sunset' },
  { id: 'stm_central_market', island_id: 'isl_oahu', region_id: 'rg_central', name: 'Country Market', requirement: 'Any Central Oʻahu shopping visit', icon: 'Store' },
];

export const passportMilestones: PassportMilestone[] = [
  { id: 'pm_waikiki', island_id: 'isl_oahu', region_id: 'rg_waikiki', name: 'Waikīkī Explorer', stamps_required: 4, bonus_points: 500, badge: 'Waikīkī Explorer' },
  { id: 'pm_north', island_id: 'isl_oahu', region_id: 'rg_north', name: 'North Shore Foodie', stamps_required: 3, bonus_points: 500, badge: 'North Shore Foodie', partner_reward_id: 'rwd_poke' },
  { id: 'pm_island', island_id: 'isl_oahu', name: 'Island Adventurer', stamps_required: 20, bonus_points: 2500, badge: 'Island Adventurer' },
  { id: 'pm_half', island_id: 'isl_oahu', name: 'Half-Island Club', stamps_required: 14, bonus_points: 1000, badge: 'Half-Island Club' },
];

// --- drops -------------------------------------------------------------------
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const agoHours = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const alohaDrops: AlohaDrop[] = [
  {
    id: 'drp_brew', stop_id: 'stp_brew', title: 'Sunrise Cold Brew Drop', blurb: 'First 100 qualifying visitors today get bonus points and a limited partner reward.',
    sponsor: 'Island Brew House', starts_at: agoHours(4), ends_at: inHours(7), points: 500,
    reward_id: 'rwd_coffee', reward_label: 'Limited: free signature coffee', quantity_total: 100, quantity_claimed: 63,
    per_user_limit: 1, eligibility: 'Verified visit within the Aloha Stop geofence today', status: 'live',
  },
  {
    id: 'drp_kahuku', stop_id: 'stp_kahuku', title: 'Country Plate Drop', blurb: 'Bonus points for verified visits to the Kahuku stretch this afternoon.',
    sponsor: 'North Shore Bites', starts_at: agoHours(1), ends_at: inHours(5), points: 350,
    reward_label: 'Free lilikoʻi soda with any plate', quantity_total: 150, quantity_claimed: 88,
    per_user_limit: 1, eligibility: 'Verified visit within the Aloha Stop geofence', status: 'live',
  },
  {
    id: 'drp_wind', stop_id: 'stp_wind', title: 'Sunrise Flow Drop', blurb: 'Tomorrow only — bonus points for the 6:30 AM ocean-deck flow.',
    sponsor: 'Windward Wellness', starts_at: inHours(12), ends_at: inHours(20), points: 400,
    reward_id: 'rwd_lomi', reward_label: 'Limited: 30-minute lomilomi session', quantity_total: 40, quantity_claimed: 0,
    per_user_limit: 1, eligibility: 'Verified visit during the drop window', status: 'scheduled',
  },
];

export const promotions: Promotion[] = [
  { id: 'prm_brew', stop_id: 'stp_brew', title: 'Happy Hour Pour-Over', detail: '20% off all pour-overs 2–4 PM daily.', starts_at: agoHours(200), ends_at: inHours(600), status: 'approved' },
  { id: 'prm_kai', stop_id: 'stp_kaimana', title: 'Two-for-Tuesday', detail: 'Second shave ice half price every Tuesday.', starts_at: agoHours(400), ends_at: inHours(900), status: 'approved' },
  { id: 'prm_nsb', stop_id: 'stp_nsb', title: 'Early Bird Poke', detail: 'Free upgrade to a large bowl before 11 AM.', starts_at: agoHours(100), ends_at: inHours(400), status: 'approved' },
  { id: 'prm_wind', stop_id: 'stp_wind', title: 'Sunset Cold Plunge', detail: 'Cold plunge included with any evening session.', starts_at: inHours(24), ends_at: inHours(700), status: 'pending' },
  { id: 'prm_lagoon', stop_id: 'stp_lagoon', title: 'Family Lagoon Friday', detail: 'Kids under 10 free with two adult day passes.', starts_at: agoHours(50), ends_at: inHours(500), status: 'approved' },
];

export const achievements: Achievement[] = [
  { id: 'ach_first', name: 'First Aloha', detail: 'Complete your first verified visit', icon: 'Sparkles', bonus_points: 100 },
  { id: 'ach_waikiki', name: 'Waikīkī Explorer', detail: 'Collect 4 Waikīkī stamps', icon: 'Palmtree', bonus_points: 500 },
  { id: 'ach_north', name: 'North Shore Foodie', detail: 'Collect 3 North Shore stamps', icon: 'UtensilsCrossed', bonus_points: 500 },
  { id: 'ach_streak', name: '5-Stop Streak', detail: 'Five verified visits in one week', icon: 'Flame', bonus_points: 400 },
  { id: 'ach_hunter', name: 'Hunt Finisher', detail: 'Complete 3 hunts', icon: 'Trophy', bonus_points: 750 },
  { id: 'ach_island', name: 'Island Adventurer', detail: 'Collect 20 Oʻahu stamps', icon: 'Compass', bonus_points: 2500 },
];

// --- demo user ---------------------------------------------------------------
export const demoUser: UserProfile = {
  id: 'usr_kai', name: 'Kai', email: 'kai@alohahunt.demo', avatar: IMG.avatar, role: 'consumer',
  island_id: 'isl_oahu', status_label: 'Oʻahu Explorer', member_since: 'March 2026', points_balance: 2450,
};

const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString();

export const seedCheckIns: CheckIn[] = [
  { id: 'chk_1', user_id: 'usr_kai', stop_id: 'stp_nsb', method: 'gps', distance_m: 34, points_awarded: 100, created_at: daysAgo(9), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_2', user_id: 'usr_kai', stop_id: 'stp_kahuku', method: 'qr', distance_m: 12, points_awarded: 100, created_at: daysAgo(9), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_3', user_id: 'usr_kai', stop_id: 'stp_kaimana', method: 'gps', distance_m: 48, points_awarded: 100, created_at: daysAgo(6), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_4', user_id: 'usr_kai', stop_id: 'stp_market', method: 'gps', distance_m: 71, points_awarded: 100, created_at: daysAgo(6), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_5', user_id: 'usr_kai', stop_id: 'stp_lookout', method: 'gps', distance_m: 118, points_awarded: 100, created_at: daysAgo(4), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_6', user_id: 'usr_kai', stop_id: 'stp_tide', method: 'qr', distance_m: 22, points_awarded: 250, created_at: daysAgo(4), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_7', user_id: 'usr_kai', stop_id: 'stp_kitchen', method: 'gps', distance_m: 40, points_awarded: 100, created_at: daysAgo(3), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_8', user_id: 'usr_kai', stop_id: 'stp_pineapple', method: 'gps', distance_m: 160, points_awarded: 100, created_at: daysAgo(2), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_9', user_id: 'usr_kai', stop_id: 'stp_wahiawa', method: 'qr', distance_m: 9, points_awarded: 100, created_at: daysAgo(2), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_10', user_id: 'usr_kai', stop_id: 'stp_chinatown', method: 'gps', distance_m: 95, points_awarded: 100, created_at: daysAgo(1), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_11', user_id: 'usr_kai', stop_id: 'stp_lagoon', method: 'gps', distance_m: 130, points_awarded: 100, created_at: daysAgo(1), device_hash: 'dev_9f31', status: 'verified' },
  { id: 'chk_12', user_id: 'usr_kai', stop_id: 'stp_wind', method: 'gps', distance_m: 55, points_awarded: 150, created_at: daysAgo(7), device_hash: 'dev_9f31', status: 'verified' },
];

export const seedStamps: UserStamp[] = [
  'stm_north_bites', 'stm_north_shrimp', 'stm_waikiki_sweet', 'stm_waikiki_market',
  'stm_east_lookout', 'stm_east_tide', 'stm_hono_kitchen', 'stm_central_field',
  'stm_central_coffee', 'stm_hono_arts', 'stm_west_lagoon', 'stm_wind_wellness',
].map((id, i) => ({ id: `ust_${i}`, user_id: 'usr_kai', stamp_id: id, earned_at: daysAgo(10 - i * 0.5) }));

export const seedHuntProgress: UserHuntProgress[] = [
  { id: 'uhp_1', user_id: 'usr_kai', hunt_id: 'hnt_north_food', started_at: daysAgo(9), completed_stop_ids: ['stp_nsb', 'stp_kahuku'], status: 'in_progress' },
  { id: 'uhp_2', user_id: 'usr_kai', hunt_id: 'hnt_east_coast', started_at: daysAgo(4), completed_stop_ids: ['stp_lookout', 'stp_tide'], completed_at: daysAgo(4), status: 'completed' },
  { id: 'uhp_3', user_id: 'usr_kai', hunt_id: 'hnt_waikiki_sunset', started_at: daysAgo(6), completed_stop_ids: ['stp_market', 'stp_kaimana'], status: 'in_progress' },
];

const ledgerSeed: PointTransaction[] = [

  { id: 'ptx_1', user_id: 'usr_kai', type: 'checkin', points: 100, label: 'North Shore Bites visit', ref_id: 'stp_nsb', created_at: daysAgo(9), idempotency_key: 'seed_1', balance_after: 900 },
  { id: 'ptx_2', user_id: 'usr_kai', type: 'checkin', points: 100, label: 'Kahuku Garlic Shrimp Truck visit', ref_id: 'stp_kahuku', created_at: daysAgo(9), idempotency_key: 'seed_2', balance_after: 1000 },
  { id: 'ptx_3', user_id: 'usr_kai', type: 'checkin', points: 150, label: 'Windward Wellness visit', ref_id: 'stp_wind', created_at: daysAgo(7), idempotency_key: 'seed_3', balance_after: 1150 },
  { id: 'ptx_4', user_id: 'usr_kai', type: 'checkin', points: 100, label: 'Kaimana Shave Ice visit', ref_id: 'stp_kaimana', created_at: daysAgo(6), idempotency_key: 'seed_4', balance_after: 1250 },
  { id: 'ptx_5', user_id: 'usr_kai', type: 'checkin', points: 100, label: 'Waikīkī Local Market visit', ref_id: 'stp_market', created_at: daysAgo(6), idempotency_key: 'seed_5', balance_after: 1350 },
  { id: 'ptx_6', user_id: 'usr_kai', type: 'drop', points: 500, label: 'Aloha Drop — Sunset Market Drop', created_at: daysAgo(5), idempotency_key: 'seed_6', balance_after: 1850 },
  { id: 'ptx_7', user_id: 'usr_kai', type: 'checkin', points: 100, label: 'Makapuʻu Ridge Lookout visit', ref_id: 'stp_lookout', created_at: daysAgo(4), idempotency_key: 'seed_7', balance_after: 1950 },
  { id: 'ptx_8', user_id: 'usr_kai', type: 'checkin', points: 250, label: 'Koko Tide Pool Tour visit', ref_id: 'stp_tide', created_at: daysAgo(4), idempotency_key: 'seed_8', balance_after: 2200 },
  { id: 'ptx_9', user_id: 'usr_kai', type: 'hunt_completion', points: 600, label: 'East Side Lookout Hunt completed', ref_id: 'hnt_east_coast', created_at: daysAgo(4), idempotency_key: 'seed_9', balance_after: 2800 },
  { id: 'ptx_10', user_id: 'usr_kai', type: 'redemption', points: -450, label: 'Redeemed: Large Shave Ice', ref_id: 'rwd_shaveice', created_at: daysAgo(3), idempotency_key: 'seed_10', balance_after: 2350 },
  { id: 'ptx_11', user_id: 'usr_kai', type: 'checkin', points: 100, label: 'Pacific Local Kitchen visit', ref_id: 'stp_kitchen', created_at: daysAgo(3), idempotency_key: 'seed_11', balance_after: 2450 },
  { id: 'ptx_12', user_id: 'usr_kai', type: 'passport_milestone', points: 500, label: 'Passport milestone — Half-Island Club progress', created_at: daysAgo(2), idempotency_key: 'seed_12', balance_after: 2950 },
  { id: 'ptx_13', user_id: 'usr_kai', type: 'redemption', points: -500, label: 'Redeemed: $15 Island Maker Credit', ref_id: 'rwd_market', created_at: daysAgo(2), idempotency_key: 'seed_13', balance_after: 2450 },
];

// Newest first for the ledger UI.
export const seedTransactions: PointTransaction[] = [...ledgerSeed].reverse();


export const seedRedemptions: Redemption[] = [
  { id: 'rdm_1', user_id: 'usr_kai', reward_id: 'rwd_shaveice', code: 'AH-3M8Q-17', created_at: daysAgo(3), expires_at: daysAgo(-4), status: 'used', used_at: daysAgo(3), point_cost: 450 },
  { id: 'rdm_2', user_id: 'usr_kai', reward_id: 'rwd_market', code: 'AH-9T2V-08', created_at: daysAgo(2), expires_at: daysAgo(-5), status: 'unused', point_cost: 900 },
];

export const seedFavorites: Favorite[] = [
  { id: 'fav_1', user_id: 'usr_kai', entity_type: 'stop', entity_id: 'stp_brew', created_at: daysAgo(8) },
  { id: 'fav_2', user_id: 'usr_kai', entity_type: 'stop', entity_id: 'stp_surf', created_at: daysAgo(7) },
  { id: 'fav_3', user_id: 'usr_kai', entity_type: 'stop', entity_id: 'stp_waimea', created_at: daysAgo(6) },
  { id: 'fav_4', user_id: 'usr_kai', entity_type: 'stop', entity_id: 'stp_sunsetgrill', created_at: daysAgo(5) },
  { id: 'fav_5', user_id: 'usr_kai', entity_type: 'hunt', entity_id: 'hnt_island_loop', created_at: daysAgo(4) },
  { id: 'fav_6', user_id: 'usr_kai', entity_type: 'reward', entity_id: 'rwd_surf', created_at: daysAgo(2) },
];

export const seedNotifications: AppNotification[] = [
  { id: 'ntf_1', user_id: 'usr_kai', channel: 'drops', title: 'Aloha Drop Nearby', body: 'A limited Drop is live 0.4 miles away at Island Brew House.', created_at: agoHours(1), read: false, action: { screen: 'drops', id: 'drp_brew' } },
  { id: 'ntf_2', user_id: 'usr_kai', channel: 'hunts', title: 'New Hunt', body: 'Discover the Windward Wellness Hunt — 900 Aloha Points.', created_at: agoHours(5), read: false, action: { screen: 'hunt', id: 'hnt_windward_wellness' } },
  { id: 'ntf_3', user_id: 'usr_kai', channel: 'expirations', title: 'Reward Expiring', body: 'Your Island Maker Credit reward expires soon.', created_at: agoHours(9), read: false, action: { screen: 'rewards' } },
  { id: 'ntf_4', user_id: 'usr_kai', channel: 'passport', title: 'Passport Progress', body: 'One more stamp to complete your Waikīkī region!', created_at: agoHours(26), read: true, action: { screen: 'passport' } },
  { id: 'ntf_5', user_id: 'usr_kai', channel: 'promotions', title: 'Happy Hour Pour-Over', body: '20% off pour-overs at Island Brew House, 2–4 PM daily.', created_at: agoHours(30), read: true, action: { screen: 'stop', id: 'stp_brew' } },
  { id: 'ntf_6', user_id: 'usr_kai', channel: 'account', title: 'New device signed in', body: 'A new session was created on iPhone 15 · Honolulu.', created_at: agoHours(52), read: true },
];

export const defaultNotificationPrefs: Record<NotificationChannel, boolean> = {
  drops: true, hunts: true, rewards: true, expirations: true, passport: true, promotions: false, account: true,
};

export const seedFraudFlags: FraudFlag[] = [
  { id: 'fr_1', user_label: 'Demo User 142', kind: 'Impossible check-in velocity', detail: 'Honolulu → North Shore · time difference 4 minutes (48 km apart)', risk: 'high', created_at: agoHours(2), status: 'open' },
  { id: 'fr_2', user_label: 'Demo User 087', kind: 'Repeated QR reuse', detail: 'Same QR nonce presented 6 times in 3 minutes at Kahuku Garlic Shrimp Truck', risk: 'high', created_at: agoHours(6), status: 'open' },
  { id: 'fr_3', user_label: 'Demo User 311', kind: 'Excessive check-in velocity', detail: '9 verified visits in 41 minutes across Waikīkī', risk: 'medium', created_at: agoHours(20), status: 'open' },
  { id: 'fr_4', user_label: 'Demo User 219', kind: 'Device sharing pattern', detail: '4 accounts sharing device hash dev_a41c', risk: 'medium', created_at: agoHours(40), status: 'dismissed' },
  { id: 'fr_5', user_label: 'Demo User 455', kind: 'Geofence spoof signature', detail: 'Mock-location provider detected during check-in attempt', risk: 'low', created_at: agoHours(60), status: 'open' },
];

export const seedAuditLogs: AuditLog[] = [
  { id: 'aud_1', actor: 'admin@alohahunt.demo', action: 'Updated point rule VISIT_PREMIUM → 150 pts', target: 'pr_visit_premium', created_at: agoHours(3) },
  { id: 'aud_2', actor: 'admin@alohahunt.demo', action: 'Approved partner reward', target: 'rwd_lagoon', created_at: agoHours(12) },
  { id: 'aud_3', actor: 'partner@islandbrewhouse.demo', action: 'Submitted Aloha Drop request', target: 'drp_brew', created_at: agoHours(26) },
  { id: 'aud_4', actor: 'admin@alohahunt.demo', action: 'Activated hunt', target: 'hnt_windward_wellness', created_at: agoHours(48) },
];

export const seedSubmissions: PartnerSubmission[] = [
  { id: 'sub_1', business_id: 'biz_brew', kind: 'drop', title: 'Sunrise Cold Brew Drop', submitted_at: agoHours(26), status: 'approved' },
  { id: 'sub_2', business_id: 'biz_brew', kind: 'reward', title: 'Free Signature Coffee', submitted_at: agoHours(200), status: 'approved' },
  { id: 'sub_3', business_id: 'biz_brew', kind: 'promotion', title: 'Sunset Cold Plunge Partnership', submitted_at: agoHours(20), status: 'pending' },
  { id: 'sub_4', business_id: 'biz_wind', kind: 'promotion', title: 'Sunset Cold Plunge', submitted_at: agoHours(18), status: 'pending' },
  { id: 'sub_5', business_id: 'biz_nsb', kind: 'reward', title: 'Country Plate Bundle', submitted_at: agoHours(70), status: 'rejected', note: 'Reward value exceeded partner tier limit.' },
];

export const MOOD_OPTIONS = [
  'food', 'adventure', 'relaxing', 'family', 'outdoors', 'shopping', 'entertainment', 'romantic', 'local', 'surprise',
] as const;

export const MOOD_LABELS: Record<string, string> = {
  food: 'Food', adventure: 'Adventure', relaxing: 'Relaxing', family: 'Family', outdoors: 'Outdoors',
  shopping: 'Shopping', entertainment: 'Entertainment', romantic: 'Romantic', local: 'Local experiences',
  surprise: 'Surprise me completely', wellness: 'Wellness', free: 'Free', friends: 'Friends',
};

// Demo GPS positions used when real device GPS is unavailable in preview.
export const DEMO_LOCATIONS = [
  { id: 'loc_waikiki', label: 'Waikīkī (near Island Brew House)', coords: { lat: 21.2795, lng: -157.8296 } },
  { id: 'loc_hono', label: 'Downtown Honolulu', coords: { lat: 21.3099, lng: -157.8601 } },
  { id: 'loc_north', label: 'Haleʻiwa, North Shore', coords: { lat: 21.5931, lng: -158.1039 } },
  { id: 'loc_kailua', label: 'Kailua, Windward', coords: { lat: 21.3928, lng: -157.7405 } },
  { id: 'loc_far', label: 'Mid-ocean (too far to check in)', coords: { lat: 21.05, lng: -158.6 } },
];
