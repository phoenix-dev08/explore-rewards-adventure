import React, { useMemo } from 'react';
import { AlohaDrop, AlohaStop, LatLng } from '@/data/types';
import { MAP_H, MAP_W, OAHU_PATH, PEARL_HARBOR, RIDGE_PATHS, ROAD_PATHS, project } from '@/lib/geo';
import { C, Icon } from './kit';
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
}

const MapCanvas: React.FC<Props> = ({
  stops, drops, huntStopIds, selectedId, userCoords, onSelect, categoryIcon, routeStopIds, compact, regionLabels,
}) => {
  const dropStopIds = useMemo(
    () => new Set(drops.filter((d) => d.status === 'live').map((d) => d.stop_id)),
    [drops],
  );
  const route = useMemo(() => {
    if (!routeStopIds?.length) return '';
    const pts = routeStopIds
      .map((id) => stops.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => project((s as AlohaStop).coords));
    if (pts.length < 2) return '';
    return `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  }, [routeStopIds, stops]);

  const up = userCoords ? project(userCoords) : null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#062B3F]">
      {/* ocean gradient + subtle depth rings */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 30% 10%, #0d5878 0%, #073349 45%, #041f2e 100%)' }} />
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 block h-full w-full overflow-hidden" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="land" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#2F7A56" />
            <stop offset="55%" stopColor="#34865C" />
            <stop offset="100%" stopColor="#1F5C43" />
          </linearGradient>
          <linearGradient id="reef" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1FA9A3" stopOpacity=".55" />
            <stop offset="100%" stopColor="#1FA9A3" stopOpacity=".12" />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* bathymetry glow */}
        <path d={OAHU_PATH} fill="url(#reef)" filter="url(#soft)" transform="translate(0 4) scale(1.035) translate(-17 -13)" />
        <path d={OAHU_PATH} fill="none" stroke="#8FE3DC" strokeOpacity=".35" strokeWidth="10" />
        <path d={OAHU_PATH} fill="url(#land)" stroke="#F6EEDF" strokeOpacity=".5" strokeWidth="2.5" strokeLinejoin="round" />
        {RIDGE_PATHS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#10402F" strokeOpacity=".38" strokeWidth="14" strokeLinecap="round" />
        ))}
        {RIDGE_PATHS.map((d, i) => (
          <path key={`r${i}`} d={d} fill="none" stroke="#7FC29B" strokeOpacity=".25" strokeWidth="3" strokeLinecap="round" />
        ))}
        <path d={PEARL_HARBOR} fill="#0B4F6C" fillOpacity=".85" />
        {ROAD_PATHS.map((d, i) => (
          <path key={`rd${i}`} d={d} fill="none" stroke="#FBF7F0" strokeOpacity=".42" strokeWidth="2.4" strokeDasharray="1 0" strokeLinecap="round" />
        ))}

        {route && (
          <>
            <path d={route} fill="none" stroke={C.sunrise} strokeOpacity=".35" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path d={route} fill="none" stroke={C.sunrise} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 9" />
          </>
        )}

        {regionLabels?.map((r) => {
          const p = project(r.center);
          return (
            <text
              key={r.name} x={p.x} y={p.y} textAnchor="middle"
              className="select-none"
              style={{ fontSize: 19, fontWeight: 800, letterSpacing: 2.4, fill: '#F6EEDF', fillOpacity: 0.42 }}
            >
              {r.name.toUpperCase()}
            </text>
          );
        })}
      </svg>

      {/* markers — HTML overlay so the 1000×773 SVG viewBox cannot expand the page */}
      <div className="absolute inset-0 overflow-hidden">
        {up && (
          <div
            className="pointer-events-none absolute"
            style={{ left: `${(up.x / MAP_W) * 100}%`, top: `${(up.y / MAP_H) * 100}%`, transform: 'translate(-50%,-50%)' }}
          >
            <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1FA9A3]/25 animate-ping" />
            <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1FA9A3]/25" />
            <span className="relative block h-7 w-7 rounded-full border-[5px] border-white bg-[#1FA9A3] shadow-[0_6px_18px_rgba(0,0,0,.4)]" />
          </div>
        )}
        {stops.map((s) => {
          const p = project(s.coords);
          const isDrop = dropStopIds.has(s.id);
          const isHunt = huntStopIds.has(s.id);
          const active = selectedId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-label={s.name}
              style={{
                left: `${(p.x / MAP_W) * 100}%`,
                top: `${(p.y / MAP_H) * 100}%`,
                transform: `translate(-50%,-100%) scale(${active ? 1.22 : 1})`,
              }}
              className="group absolute origin-bottom transition-transform duration-300"
            >
              {isDrop && (
                <span className="absolute -inset-3 -z-10 rounded-full bg-[#FF9E4A]/35 blur-md animate-pulse" />
              )}
              <span
                className={cn(
                  'relative flex items-center justify-center rounded-full border-[3px] shadow-[0_8px_18px_-4px_rgba(3,26,39,.65)]',
                  compact ? 'h-8 w-8' : 'h-11 w-11',
                  active ? 'border-white' : 'border-white/85',
                )}
                style={{
                  background: isDrop
                    ? 'linear-gradient(140deg,#FF9E4A,#FF6F59)'
                    : isHunt
                      ? 'linear-gradient(140deg,#E7C577,#D4A853)'
                      : 'linear-gradient(140deg,#1FA9A3,#0B4F6C)',
                }}
              >
                <Icon
                  name={isDrop ? 'Zap' : isHunt ? 'Flag' : categoryIcon(s.category_id)}
                  className={cn(compact ? 'h-3.5 w-3.5' : 'h-5 w-5', isHunt ? 'text-[#3A2A05]' : 'text-white')}
                />
                <span
                  className="absolute -bottom-[9px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-white/85"
                  style={{ background: isDrop ? '#FF6F59' : isHunt ? '#D4A853' : '#0B4F6C' }}
                />
              </span>
              {!compact && (
                <span className={cn(
                  'absolute left-1/2 top-full mt-2.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#031A27]/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur transition-opacity',
                  active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}>
                  {s.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MapCanvas;
