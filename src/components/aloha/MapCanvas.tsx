import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapLibreMap, LngLatBounds, GeoJSONSource } from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AlohaDrop, AlohaStop, LatLng } from '@/data/types';
import { OAHU_CENTER, OAHU_MAX_BOUNDS, geofenceRing } from '@/lib/geo';
import { CooldownClock, Icon } from './kit';
import { cn } from '@/lib/utils';

interface Props {
  stops: AlohaStop[];
  drops: AlohaDrop[];
  huntStopIds: Set<string>;
  selectedId?: string | null;
  userCoords: LatLng | null;
  onSelect: (id: string) => void;
  categoryIcon: (catId: string) => string;
  routeStopIds?: string[];
  compact?: boolean;
  regionLabels?: { name: string; center: LatLng }[];
  inRangeIds?: Set<string>;
  approachingIds?: Set<string>;
  cooldownIds?: Set<string>;
  cooldownUntil?: Record<string, string>;
  passportStopIds?: Set<string>;
  rewardStopIds?: Set<string>;
}

/** OpenStreetMap raster — real streets, no API key. */
const OSM_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const MapCanvas: React.FC<Props> = ({
  stops, drops, huntStopIds, selectedId, userCoords, onSelect, categoryIcon, routeStopIds, compact,
  inRangeIds, approachingIds, cooldownIds, cooldownUntil, passportStopIds, rewardStopIds,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const flownUser = useRef<string | null>(null);
  const lastSelected = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [, setViewTick] = useState(0);

  const dropStopIds = useMemo(
    () => new Set(drops.filter((d) => d.status === 'live').map((d) => d.stop_id)),
    [drops],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const map = new MapLibreMap({
      container: el,
      style: OSM_STYLE,
      center: [userCoords?.lng ?? OAHU_CENTER.lng, userCoords?.lat ?? OAHU_CENTER.lat],
      zoom: compact ? 11 : 10.85,
      minZoom: compact ? 8.5 : 9.2,
      maxZoom: 18,
      maxBounds: OAHU_MAX_BOUNDS,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      fadeDuration: 0,
    });
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    const bump = () => setViewTick((n) => n + 1);
    const onReady = () => {
      setReady(true);
      bump();
      map.resize();
    };

    map.on('load', onReady);
    map.on('move', bump);
    map.on('resize', bump);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // Map is created once per mount (compact vs full are separate instances).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  // Hunt route + geofence rings on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const features: GeoJSON.Feature[] = [];
    if (routeStopIds?.length) {
      const line = routeStopIds
        .map((id) => stops.find((s) => s.id === id))
        .filter(Boolean)
        .map((s) => [(s as AlohaStop).coords.lng, (s as AlohaStop).coords.lat] as [number, number]);
      if (line.length >= 2) {
        features.push({
          type: 'Feature',
          properties: { kind: 'route' },
          geometry: { type: 'LineString', coordinates: line },
        });
      }
    }
    stops.forEach((s) => {
      if (!inRangeIds?.has(s.id) && s.id !== selectedId) return;
      features.push({
        type: 'Feature',
        properties: { kind: 'geofence', hot: inRangeIds?.has(s.id) ? 1 : 0 },
        geometry: { type: 'Polygon', coordinates: [geofenceRing(s.coords, s.geofence_m)] },
      });
    });

    const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
    const src = map.getSource('ah-overlay') as GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
      return;
    }
    map.addSource('ah-overlay', { type: 'geojson', data });
    map.addLayer({
      id: 'ah-geofence-fill',
      type: 'fill',
      source: 'ah-overlay',
      filter: ['==', ['get', 'kind'], 'geofence'],
      paint: {
        'fill-color': ['case', ['==', ['get', 'hot'], 1], '#1FA9A3', '#D4A853'],
        'fill-opacity': 0.16,
      },
    });
    map.addLayer({
      id: 'ah-geofence-line',
      type: 'line',
      source: 'ah-overlay',
      filter: ['==', ['get', 'kind'], 'geofence'],
      paint: {
        'line-color': ['case', ['==', ['get', 'hot'], 1], '#1FA9A3', '#D4A853'],
        'line-width': 2,
        'line-opacity': 0.7,
      },
    });
    map.addLayer({
      id: 'ah-route-glow',
      type: 'line',
      source: 'ah-overlay',
      filter: ['==', ['get', 'kind'], 'route'],
      paint: { 'line-color': '#FF9E4A', 'line-width': 8, 'line-opacity': 0.28, 'line-blur': 1 },
    });
    map.addLayer({
      id: 'ah-route',
      type: 'line',
      source: 'ah-overlay',
      filter: ['==', ['get', 'kind'], 'route'],
      paint: { 'line-color': '#FF6F59', 'line-width': 3.5, 'line-dasharray': [1.4, 1.1] },
    });
  }, [ready, stops, routeStopIds, inRangeIds, selectedId]);

  // Compact hunt/itinerary maps fit their stops
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !compact) return;
    const pts = (routeStopIds?.length ? routeStopIds.map((id) => stops.find((s) => s.id === id)).filter(Boolean) : stops) as AlohaStop[];
    if (!pts.length) return;
    const b = new LngLatBounds();
    pts.forEach((s) => b.extend([s.coords.lng, s.coords.lat]));
    if (userCoords) b.extend([userCoords.lng, userCoords.lat]);
    map.fitBounds(b, { padding: 36, maxZoom: 13.5, duration: 500 });
  }, [ready, compact, routeStopIds, stops, userCoords]);

  // Explore: fly to the user when GPS/demo location arrives
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !userCoords || compact) return;
    const key = `${userCoords.lat.toFixed(5)},${userCoords.lng.toFixed(5)}`;
    if (flownUser.current === key) return;
    flownUser.current = key;
    map.easeTo({
      center: [userCoords.lng, userCoords.lat],
      zoom: Math.max(map.getZoom(), 14.4),
      duration: 900,
    });
  }, [userCoords, ready, compact]);

  // Fly to a selected Aloha Stop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId || compact) return;
    if (lastSelected.current === selectedId) return;
    lastSelected.current = selectedId;
    const stop = stops.find((s) => s.id === selectedId);
    if (!stop) return;
    map.easeTo({
      center: [stop.coords.lng, stop.coords.lat],
      zoom: Math.max(map.getZoom(), 15.2),
      duration: 650,
      offset: [0, 80],
    });
  }, [selectedId, ready, compact, stops]);

  const map = mapRef.current;
  const projectScreen = (c: LatLng) => {
    if (!map || !ready) return null;
    const p = map.project([c.lng, c.lat]);
    if (p.x < -80 || p.y < -80 || p.x > (wrapRef.current?.clientWidth ?? 0) + 80 || p.y > (wrapRef.current?.clientHeight ?? 0) + 80) {
      return null;
    }
    return p;
  };

  const recenter = () => {
    if (!map || !userCoords) return;
    map.easeTo({ center: [userCoords.lng, userCoords.lat], zoom: 15.2, duration: 600 });
  };

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-[#d5e4d4]', compact && 'ah-map-compact', 'ah-real-map')}>
      <div ref={wrapRef} className="absolute inset-0" />

      {ready && (
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
          {userCoords && (() => {
            const p = projectScreen(userCoords);
            if (!p) return null;
            return (
              <div
                className="absolute"
                style={{ left: p.x, top: p.y, transform: 'translate(-50%,-50%)' }}
              >
                <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1FA9A3]/25 animate-ping" />
                <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1FA9A3]/25" />
                <span className="relative block h-7 w-7 rounded-full border-[5px] border-white bg-[#1FA9A3] shadow-[0_6px_18px_rgba(0,0,0,.4)]" />
              </div>
            );
          })()}

          {stops.map((s) => {
            const p = projectScreen(s.coords);
            if (!p) return null;
            const isDrop = dropStopIds.has(s.id);
            const isHunt = huntStopIds.has(s.id);
            const isPassport = passportStopIds?.has(s.id);
            const isReward = rewardStopIds?.has(s.id);
            const active = selectedId === s.id;
            const inRange = inRangeIds?.has(s.id);
            const approaching = approachingIds?.has(s.id) && !inRange;
            const cooling = cooldownIds?.has(s.id);
            const far = !!userCoords && !inRange && !approaching && !cooling;
            const until = cooldownUntil?.[s.id];
            const pinBg = cooling
              ? 'linear-gradient(140deg,#6B7C86,#3A4F5C)'
              : inRange
                ? 'linear-gradient(140deg,#E7C577,#1FA9A3)'
                : approaching
                  ? 'linear-gradient(140deg,#C9B36A,#0B4F6C)'
                  : isDrop
                    ? 'linear-gradient(140deg,#FF9E4A,#FF6F59)'
                    : isHunt
                      ? 'linear-gradient(140deg,#E7C577,#D4A853)'
                      : 'linear-gradient(140deg,#1FA9A3,#0B4F6C)';
            const stem = cooling ? '#3A4F5C' : inRange ? '#1FA9A3' : approaching ? '#8A7A3A' : isDrop ? '#FF6F59' : isHunt ? '#D4A853' : '#0B4F6C';
            const label = cooling
              ? 'Cooldown'
              : inRange
                ? '🌺 IN RANGE — TAP'
                : approaching
                  ? 'Getting close…'
                  : far
                    ? 'Too far'
                    : s.name;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                aria-label={`${s.name}. ${label}`}
                style={{
                  left: p.x,
                  top: p.y,
                  transform: `translate(-50%,-100%) scale(${active || inRange ? 1.22 : approaching ? 1.08 : 1})`,
                }}
                className="pointer-events-auto group absolute origin-bottom transition-transform duration-200"
              >
                {inRange && !cooling && (
                  <>
                    <span className="absolute -inset-7 -z-10 rounded-full bg-[#E7C577]/45 blur-md" style={{ animation: 'ah-swell 1.6s ease-out infinite' }} />
                    <span className="absolute -inset-3 -z-10 rounded-full bg-[#1FA9A3]/50" style={{ animation: 'ah-marker-glow 1.4s ease-in-out infinite' }} />
                  </>
                )}
                {approaching && !cooling && (
                  <span className="absolute -inset-4 -z-10 rounded-full bg-[#E7C577]/28 blur-sm" style={{ animation: 'ah-swell 2.2s ease-out infinite' }} />
                )}
                {isDrop && !inRange && !approaching && !cooling && (
                  <span className="absolute -inset-3 -z-10 rounded-full bg-[#FF9E4A]/35 blur-md animate-pulse" />
                )}
                {cooling && until && !compact && (
                  <span className="pointer-events-none absolute left-1/2 top-[-24px] -translate-x-1/2 rounded-full bg-[#031A27]/92 px-2 py-0.5 font-mono text-[10px] font-black tabular-nums text-[#E7C577] shadow-md">
                    🕐 <CooldownClock until={until} prefix="" />
                  </span>
                )}
                <span
                  className={cn(
                    'relative flex items-center justify-center rounded-full border-[3px] shadow-[0_8px_18px_-4px_rgba(3,26,39,.65)]',
                    compact ? 'h-8 w-8' : 'h-11 w-11',
                    active || inRange ? 'border-white' : 'border-white/85',
                    cooling && 'opacity-60',
                    far && 'opacity-45 grayscale',
                    approaching && 'opacity-90',
                  )}
                  style={{
                    background: pinBg,
                    animation: inRange && !cooling
                      ? 'ah-marker-glow 1.6s ease-in-out infinite'
                      : approaching && !cooling
                        ? 'ah-approach-pulse 2s ease-in-out infinite'
                        : cooling
                          ? 'ah-cooldown-dim 2.4s ease-in-out infinite'
                          : undefined,
                  }}
                >
                  <Icon
                    name={cooling ? 'Clock' : far ? 'Lock' : inRange ? 'Sparkles' : isDrop ? 'Zap' : isHunt ? 'Flag' : categoryIcon(s.category_id)}
                    className={cn(compact ? 'h-3.5 w-3.5' : 'h-5 w-5', isHunt && !cooling && !inRange && !far ? 'text-[#3A2A05]' : 'text-white')}
                  />
                  <span
                    className="absolute -bottom-[9px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-white/85"
                    style={{ background: stem }}
                  />
                  {!compact && !far && !cooling && (
                    <span className="absolute -right-1.5 -top-1.5 flex gap-0.5">
                      {isPassport && <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#D4A853] text-[#3A2A05] ring-2 ring-white"><Icon name="Stamp" className="h-2 w-2" /></span>}
                      {isReward && <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FF6F59] text-white ring-2 ring-white"><Icon name="Gift" className="h-2 w-2" /></span>}
                    </span>
                  )}
                </span>
                {!compact && (
                  <span className={cn(
                    'pointer-events-none absolute left-1/2 top-full mt-2.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#031A27]/88 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur transition-opacity',
                    active || inRange || cooling || approaching ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  )}>
                    {cooling && until ? <>🕐 Cooldown — <CooldownClock until={until} prefix="" /></> : label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {userCoords && !compact && (
        <button
          type="button"
          onClick={recenter}
          aria-label="Recenter on my location"
          className="absolute right-3 z-[3] flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-[#0B4F6C] shadow-[0_10px_24px_-12px_rgba(3,26,39,.55)] ring-1 ring-black/5 transition active:scale-95"
          style={{ bottom: 118 }}
        >
          <Icon name="LocateFixed" className="h-5 w-5 text-[#1FA9A3]" />
        </button>
      )}
    </div>
  );
};

export default MapCanvas;
