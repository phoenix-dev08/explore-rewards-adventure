import { LatLng } from '@/data/types';

// Oʻahu map projection bounding box. Islands/markets each carry their own box,
// so adding Maui later is a data change, not a code change.
export const MAP_BOX = { lngMin: -158.32, lngMax: -157.6, latMin: 21.22, latMax: 21.74 };
export const MAP_W = 1000;
export const MAP_H = 773;
export const OAHU_CENTER: LatLng = { lat: 21.4389, lng: -157.999 };
/** MapLibre maxBounds: [west, south], [east, north] with ocean padding. */
export const OAHU_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-158.45, 21.15],
  [-157.52, 21.82],
];

export function geofenceRing(center: LatLng, radiusM: number, steps = 64): [number, number][] {
  const ring: [number, number][] = [];
  const latM = 111_320;
  const lngM = 111_320 * Math.cos((center.lat * Math.PI) / 180);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([
      center.lng + (Math.cos(a) * radiusM) / lngM,
      center.lat + (Math.sin(a) * radiusM) / latM,
    ]);
  }
  return ring;
}

export function project(c: LatLng) {
  const x = ((c.lng - MAP_BOX.lngMin) / (MAP_BOX.lngMax - MAP_BOX.lngMin)) * MAP_W;
  const y = ((MAP_BOX.latMax - c.lat) / (MAP_BOX.latMax - MAP_BOX.latMin)) * MAP_H;
  return { x, y };
}

export function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isInGeofence(user: LatLng | null, stopCoords: LatLng, radiusM: number, distM?: number | null) {
  if (!user) return false;
  const d = distM ?? distanceMeters(user, stopCoords);
  return d <= Math.max(20, radiusM || 100);
}

/** Close enough to start glowing, but not yet inside the collect geofence. */
export function isApproachingStop(user: LatLng | null, stopCoords: LatLng, radiusM: number, distM?: number | null) {
  if (!user) return false;
  const d = distM ?? distanceMeters(user, stopCoords);
  const fence = Math.max(20, radiusM || 100);
  return d > fence && d <= Math.max(fence * 4, 400);
}

export function formatDistance(m: number | null) {
  if (m === null || Number.isNaN(m)) return '—';
  const miles = m / 1609.34;
  if (miles < 0.1) return `${Math.round(m)} m away`;
  if (miles < 10) return `${miles.toFixed(1)} mi away`;
  return `${Math.round(miles)} mi away`;
}

// Coastline of Oʻahu, traced from real coordinates and projected with the same
// transform as the markers so pins always land in the right place.
const COAST: LatLng[] = [
  { lat: 21.574, lng: -158.281 }, { lat: 21.585, lng: -158.13 }, { lat: 21.593, lng: -158.103 },
  { lat: 21.641, lng: -158.063 }, { lat: 21.674, lng: -158.04 }, { lat: 21.711, lng: -157.996 },
  { lat: 21.678, lng: -157.949 }, { lat: 21.648, lng: -157.921 }, { lat: 21.553, lng: -157.85 },
  { lat: 21.518, lng: -157.837 }, { lat: 21.49, lng: -157.82 }, { lat: 21.44, lng: -157.79 },
  { lat: 21.455, lng: -157.74 }, { lat: 21.4, lng: -157.735 }, { lat: 21.335, lng: -157.68 },
  { lat: 21.31, lng: -157.647 }, { lat: 21.275, lng: -157.68 }, { lat: 21.269, lng: -157.694 },
  { lat: 21.28, lng: -157.73 }, { lat: 21.255, lng: -157.805 }, { lat: 21.29, lng: -157.845 },
  { lat: 21.305, lng: -157.865 }, { lat: 21.32, lng: -157.975 }, { lat: 21.315, lng: -158.015 },
  { lat: 21.297, lng: -158.113 }, { lat: 21.335, lng: -158.122 }, { lat: 21.39, lng: -158.155 },
  { lat: 21.437, lng: -158.192 }, { lat: 21.47, lng: -158.22 },
];

export const OAHU_PATH = (() => {
  const pts = COAST.map(project);
  return `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`;
})();

// Decorative ridge lines (Koʻolau + Waiʻanae ranges) and highways.
export const RIDGE_PATHS = [
  [{ lat: 21.7, lng: -157.99 }, { lat: 21.6, lng: -157.93 }, { lat: 21.5, lng: -157.86 }, { lat: 21.4, lng: -157.79 }, { lat: 21.31, lng: -157.72 }],
  [{ lat: 21.56, lng: -158.26 }, { lat: 21.5, lng: -158.2 }, { lat: 21.44, lng: -158.16 }, { lat: 21.36, lng: -158.13 }],
].map((line) => `M ${line.map(project).map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`);

export const ROAD_PATHS = [
  // H1 corridor: west Oʻahu → Honolulu → Waikīkī
  [{ lat: 21.33, lng: -158.09 }, { lat: 21.33, lng: -158.0 }, { lat: 21.32, lng: -157.92 }, { lat: 21.31, lng: -157.86 }, { lat: 21.28, lng: -157.83 }],
  // H2 / central spine to the North Shore
  [{ lat: 21.33, lng: -158.02 }, { lat: 21.44, lng: -158.03 }, { lat: 21.52, lng: -158.04 }, { lat: 21.59, lng: -158.1 }],
  // Windward + east coastal highway
  [{ lat: 21.71, lng: -157.99 }, { lat: 21.6, lng: -157.92 }, { lat: 21.5, lng: -157.84 }, { lat: 21.4, lng: -157.74 }, { lat: 21.31, lng: -157.66 }, { lat: 21.27, lng: -157.71 }, { lat: 21.27, lng: -157.8 }],
].map((line) => `M ${line.map(project).map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`);

export const PEARL_HARBOR = (() => {
  const pts: LatLng[] = [
    { lat: 21.321, lng: -157.973 }, { lat: 21.345, lng: -157.965 }, { lat: 21.36, lng: -157.98 },
    { lat: 21.355, lng: -158.0 }, { lat: 21.37, lng: -158.015 }, { lat: 21.35, lng: -158.03 },
    { lat: 21.335, lng: -158.005 }, { lat: 21.325, lng: -157.99 },
  ];
  return `M ${pts.map(project).map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`;
})();
