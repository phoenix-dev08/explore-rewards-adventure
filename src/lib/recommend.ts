// ---------------------------------------------------------------------------
// Surprise Me — modular recommendation engine.
// Rules-based today; the scoring function is isolated so an AI ranking service
// can replace `scoreStop` without touching the UI.
// ---------------------------------------------------------------------------
import { Adventure, AdventurePrefs, AlohaStop, LatLng, Region } from '@/data/types';
import { distanceMeters } from './geo';
import { uid } from './engine';

const ORDER = ['cat_coffee', 'cat_attractions', 'cat_activities', 'cat_tours', 'cat_food', 'cat_shopping', 'cat_wellness', 'cat_entertainment', 'cat_dessert'];

function isOpenNow(stop: AlohaStop, at = new Date()) {
  const h = stop.hours.find((x) => x.day === at.getDay());
  if (!h) return false;
  const mins = at.getHours() * 60 + at.getMinutes();
  const [oh, om] = h.open.split(':').map(Number);
  const [ch, cm] = h.close.split(':').map(Number);
  return mins >= oh * 60 + om && mins <= ch * 60 + cm;
}

export function stopIsOpen(stop: AlohaStop, at = new Date()) {
  return isOpenNow(stop, at);
}

export function hoursLabel(stop: AlohaStop, at = new Date()) {
  const h = stop.hours.find((x) => x.day === at.getDay());
  if (!h) return 'Hours vary';
  const fmt = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    const ap = hh >= 12 ? 'PM' : 'AM';
    const hr = hh % 12 === 0 ? 12 : hh % 12;
    return `${hr}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${ap}`;
  };
  return `${fmt(h.open)} – ${fmt(h.close)}`;
}

export function budgetCeiling(b: AdventurePrefs['budget']) {
  return b === 999 ? Number.POSITIVE_INFINITY : b;
}

const TIER_SPEND: Record<number, number> = { 1: 15, 2: 35, 3: 80, 4: 150 };

/** Typical dollars a guest spends at this Stop. Missing or contradictory rows stay conservative. */
export function typicalSpend(stop: AlohaStop): number {
  const raw = Number(stop.avg_spend);
  const markedFree = Array.isArray(stop.moods) && stop.moods.includes('free');
  const tier = Number(stop.price_tier);
  if (Number.isFinite(raw) && raw > 0) return raw;
  if (Number.isFinite(raw) && raw === 0) {
    if (markedFree || !Number.isFinite(tier) || tier <= 1) return 0;
    return TIER_SPEND[tier] ?? 35;
  }
  if (markedFree) return 0;
  if (Number.isFinite(tier) && TIER_SPEND[tier] != null) return TIER_SPEND[tier];
  return Number.POSITIVE_INFINITY;
}

export function spendLabel(stop: AlohaStop) {
  const n = typicalSpend(stop);
  if (!Number.isFinite(n)) return 'Price varies';
  return n === 0 ? 'Free' : `$${n}`;
}

/** Hard rule: every Stop on the plan must sit at or under the chosen cap. Free means $0 only. */
export function fitsBudget(stop: AlohaStop, prefs: AdventurePrefs) {
  const ceiling = budgetCeiling(prefs.budget);
  if (!Number.isFinite(ceiling)) return true;
  return typicalSpend(stop) <= ceiling;
}

export function huntFitsBudget(
  huntId: string,
  huntStops: { hunt_id: string; stop_id: string }[],
  stops: AlohaStop[],
  prefs: AdventurePrefs,
) {
  const members = huntStops.filter((hs) => hs.hunt_id === huntId);
  if (!members.length) return false;
  return members.every((hs) => {
    const stop = stops.find((s) => s.id === hs.stop_id);
    return !!stop && fitsBudget(stop, prefs);
  });
}

export function budgetLabel(b: AdventurePrefs['budget']) {
  if (b === 0) return 'Free only';
  if (b === 999) return 'Any budget';
  return `$${b} or less per stop`;
}

export function scoreStop(stop: AlohaStop, prefs: AdventurePrefs, origin: LatLng | null) {
  if (!fitsBudget(stop, prefs)) return -Infinity;
  let score = 0;
  const moods = prefs.moods.includes('surprise') ? [] : prefs.moods;
  const mapped = moods.map((m) => (m === 'beach' ? 'outdoors' : m === 'culture' ? 'local' : m));
  const overlap = stop.moods.filter((m) => mapped.includes(m) || moods.includes(m)).length;
  score += overlap * 34;
  if (moods.includes('beach') && (stop.moods.includes('outdoors') || stop.moods.includes('adventure'))) score += 16;
  if (moods.includes('culture') && stop.moods.includes('local')) score += 16;
  if (moods.length === 0) score += 12;
  if (stop.featured) score += 10;
  score += (stop.rating - 4) * 18;
  if (isOpenNow(stop)) score += 22; else score -= 30;
  if (prefs.company === 'family' && stop.moods.includes('family')) score += 18;
  if (prefs.company === 'friends' && stop.group_friendly) score += 12;
  if (prefs.company === 'partner' && stop.moods.includes('romantic')) score += 20;
  if (prefs.company === 'solo' && stop.moods.includes('relaxing')) score += 8;
  if (prefs.budget === 0) score += 28;
  else score += 8;
  if (origin) {
    const km = distanceMeters(origin, stop.coords) / 1000;
    score += Math.max(-40, 26 - km * 1.4);
  }
  if (prefs.regionId && stop.region_id === prefs.regionId) score += 26;
  return score;
}

const TITLES: Record<string, string[]> = {
  food: ['Slow Food Crawl', 'Local Flavor Run', 'Plate-Lunch Loop'],
  adventure: ['Adventure Circuit', 'Salt & Sunshine Run', 'Big Day Out'],
  relaxing: ['Easygoing Afternoon', 'Unhurried Escape', 'Soft Day Reset'],
  family: ['Family Day Plan', 'Everyone-Happy Loop'],
  outdoors: ['Fresh Air Route', 'Coastline Wander'],
  shopping: ['Island Makers Loop', 'Local Finds Run'],
  entertainment: ['Golden Hour & Live Music', 'Evening Out'],
  romantic: ['Two-Person Sunset Plan', 'Slow Romantic Route'],
  local: ['Like-a-Local Loop', 'Neighborhood Gems'],
  surprise: ['Wildcard Aloha Route', 'Dealer’s Choice Day'],
};

export function buildAdventure(
  stops: AlohaStop[],
  regions: Region[],
  prefs: AdventurePrefs,
  origin: LatLng | null,
  shuffleSalt = 0,
): Adventure {
  const targetMinutes = prefs.minutes;
  const maxStops = targetMinutes <= 60 ? 2 : targetMinutes <= 180 ? 4 : targetMinutes <= 300 ? 5 : 6;

  const ranked = stops
    .filter((s) => s.status === 'approved' && fitsBudget(s, prefs))
    .map((s) => ({ s, score: scoreStop(s, prefs, origin) + ((hash(s.id + shuffleSalt) % 22) - 11) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return {
      id: uid('adv'),
      title: 'No stops in this budget',
      summary: prefs.budget === 0
        ? 'Every Aloha Stop on this plan must be free. Nothing in the current catalog matched — try a nearby region or raise the budget.'
        : `Nothing in the catalog is ${budgetLabel(prefs.budget).toLowerCase()}. Try a higher budget or Treat ourselves.`,
      stopIds: [],
      minutes: 0,
      spend: 0,
      bonus_points: 0,
      region_id: prefs.regionId ?? '',
      prefs,
      created_at: new Date().toISOString(),
    };
  }

  // Anchor on the strongest region that still has in-budget Stops.
  const regionScores = new Map<string, number>();
  ranked.slice(0, 12).forEach(({ s, score }) => regionScores.set(s.region_id, (regionScores.get(s.region_id) ?? 0) + score));
  const anchorRegion = [...regionScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ranked[0].s.region_id;

  const pool = ranked.filter(({ s }) => s.region_id === anchorRegion);
  const spill = ranked.filter(({ s }) => s.region_id !== anchorRegion);
  const picked: AlohaStop[] = [];
  const usedCats = new Set<string>();
  let spend = 0;
  let minutes = 0;

  for (const { s } of [...pool, ...spill]) {
    if (picked.length >= maxStops) break;
    if (!fitsBudget(s, prefs)) continue;
    if (usedCats.has(s.category_id) && picked.length > 1) continue;
    if (minutes + s.avg_minutes + 20 > targetMinutes + 45) continue;
    picked.push(s);
    usedCats.add(s.category_id);
    spend += typicalSpend(s);
    minutes += s.avg_minutes + 20;
  }

  // Fill remaining time with more in-budget Stops only — never pad with paid options.
  if (picked.length < Math.min(2, ranked.length)) {
    for (const { s } of ranked) {
      if (picked.length >= Math.min(maxStops, ranked.length)) break;
      if (picked.includes(s) || !fitsBudget(s, prefs)) continue;
      if (prefs.budget === 0 && typicalSpend(s) > 0) continue;
      picked.push(s);
      spend += typicalSpend(s);
      minutes += s.avg_minutes + 20;
    }
  }

  picked.sort((a, b) => ORDER.indexOf(a.category_id) - ORDER.indexOf(b.category_id));

  const regionName = regions.find((r) => r.id === anchorRegion)?.name ?? 'Oʻahu';
  const moodKey = prefs.moods.find((m) => TITLES[m]) ?? 'surprise';
  const titleOptions = TITLES[moodKey] ?? TITLES.surprise;
  const title = `${regionName} ${titleOptions[hash(String(shuffleSalt) + moodKey) % titleOptions.length]}`;
  const bonus = 300 * picked.length + (prefs.minutes >= 300 ? 300 : 0);

  const companyWord = { solo: 'a solo day', partner: 'two', friends: 'your crew', family: 'the whole family' }[prefs.company];
  const budgetBit = prefs.budget === 0
    ? 'every stop is free'
    : prefs.budget === 999
      ? 'no spend cap'
      : `every stop is $${prefs.budget} or less`;
  const summary = `Built for ${companyWord} around ${regionName} — ${picked.length} Aloha Stop${picked.length === 1 ? '' : 's'}, ${budgetBit}, paced for ${formatMinutes(minutes)}.`;

  return {
    id: uid('adv'), title, summary, stopIds: picked.map((s) => s.id),
    minutes, spend, bonus_points: bonus, region_id: anchorRegion, prefs,
    created_at: new Date().toISOString(),
  };
}

export function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  return `${h}h ${min ? `${String(min).padStart(2, '0')}m` : ''}`.trim();
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
