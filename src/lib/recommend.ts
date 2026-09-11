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

function budgetCeiling(b: AdventurePrefs['budget']) {
  return b === 0 ? 0 : b === 999 ? 100000 : b;
}

export function scoreStop(stop: AlohaStop, prefs: AdventurePrefs, origin: LatLng | null) {
  let score = 0;
  const moods = prefs.moods.includes('surprise') ? [] : prefs.moods;
  const overlap = stop.moods.filter((m) => moods.includes(m)).length;
  score += overlap * 34;
  if (moods.length === 0) score += 12;
  if (stop.featured) score += 10;
  score += (stop.rating - 4) * 18;
  if (isOpenNow(stop)) score += 22; else score -= 30;
  if (prefs.company === 'family' && stop.moods.includes('family')) score += 18;
  if (prefs.company === 'friends' && stop.group_friendly) score += 12;
  if (prefs.company === 'partner' && stop.moods.includes('romantic')) score += 20;
  if (prefs.company === 'solo' && stop.moods.includes('relaxing')) score += 8;
  const ceiling = budgetCeiling(prefs.budget);
  if (prefs.budget === 0) score += stop.avg_spend === 0 ? 40 : -60;
  else if (stop.avg_spend > ceiling) score -= 45;
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
    .filter((s) => s.status === 'approved')
    .map((s) => ({ s, score: scoreStop(s, prefs, origin) + ((hash(s.id + shuffleSalt) % 22) - 11) }))
    .sort((a, b) => b.score - a.score);

  // Anchor on the strongest region so the route stays geographically tight.
  const regionScores = new Map<string, number>();
  ranked.slice(0, 12).forEach(({ s, score }) => regionScores.set(s.region_id, (regionScores.get(s.region_id) ?? 0) + score));
  const anchorRegion = [...regionScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ranked[0].s.region_id;

  const pool = ranked.filter(({ s }) => s.region_id === anchorRegion);
  const spill = ranked.filter(({ s }) => s.region_id !== anchorRegion);
  const picked: AlohaStop[] = [];
  const usedCats = new Set<string>();
  const ceiling = budgetCeiling(prefs.budget);
  let spend = 0;
  let minutes = 0;

  for (const { s } of [...pool, ...spill]) {
    if (picked.length >= maxStops) break;
    if (usedCats.has(s.category_id) && picked.length > 1) continue;
    if (minutes + s.avg_minutes + 20 > targetMinutes + 45) continue;
    if (prefs.budget !== 999 && spend + s.avg_spend > ceiling) continue;
    picked.push(s);
    usedCats.add(s.category_id);
    spend += s.avg_spend;
    minutes += s.avg_minutes + 20;
  }
  if (picked.length < 2) {
    for (const { s } of ranked) {
      if (picked.length >= 2) break;
      if (!picked.includes(s)) { picked.push(s); spend += s.avg_spend; minutes += s.avg_minutes + 20; }
    }
  }

  picked.sort((a, b) => ORDER.indexOf(a.category_id) - ORDER.indexOf(b.category_id));

  const regionName = regions.find((r) => r.id === anchorRegion)?.name ?? 'Oʻahu';
  const moodKey = prefs.moods.find((m) => TITLES[m]) ?? 'surprise';
  const titleOptions = TITLES[moodKey];
  const title = `${regionName} ${titleOptions[hash(String(shuffleSalt) + moodKey) % titleOptions.length]}`;
  const bonus = 300 * picked.length + (prefs.minutes >= 300 ? 300 : 0);

  const companyWord = { solo: 'a solo day', partner: 'two', friends: 'your crew', family: 'the whole family' }[prefs.company];
  const summary = `Built for ${companyWord} around ${regionName} — ${picked.length} Aloha Stops, all open in your window, paced for ${formatMinutes(minutes)}.`;

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
