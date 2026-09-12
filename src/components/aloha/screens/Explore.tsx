import React, { useEffect, useMemo, useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import MapCanvas from '../MapCanvas';
import { Btn, Chip, CooldownClock, Icon, Pill, Sheet, Skeleton } from '../kit';
import { PointsBadge, StopRow, SaveButton, useHelpers } from '../cards';
import { formatDistance, isApproachingStop } from '@/lib/geo';
import { hoursLabel, stopIsOpen } from '@/lib/recommend';
import { cn } from '@/lib/utils';
import { AlohaStop } from '@/data/types';
import { DEMO_LOCATIONS } from '@/data/seed';
import CheckIn from './CheckIn';


const FILTERS = [
  { id: 'nearby', label: 'Nearby', icon: 'LocateFixed' },
  { id: 'inrange', label: 'In range', icon: 'Sparkles' },
  { id: 'hunts', label: 'Hunts', icon: 'Flag' },
  { id: 'saved', label: 'Saved', icon: 'Heart' },
  { id: 'cat_food', label: 'Food', icon: 'UtensilsCrossed' },
  { id: 'cat_coffee', label: 'Coffee', icon: 'Coffee' },
  { id: 'cat_dessert', label: 'Dessert', icon: 'IceCream2' },
  { id: 'cat_activities', label: 'Activities', icon: 'Waves' },
  { id: 'cat_tours', label: 'Tours', icon: 'Compass' },
  { id: 'cat_attractions', label: 'Attractions', icon: 'Mountain' },
  { id: 'cat_shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { id: 'cat_entertainment', label: 'Entertainment', icon: 'Music' },
  { id: 'cat_wellness', label: 'Wellness', icon: 'Flower2' },
  { id: 'rewards', label: 'Rewards', icon: 'Gift' },
  { id: 'passport', label: 'Passport', icon: 'Stamp' },
  { id: 'drops', label: 'Drops', icon: 'Zap' },
];

const Explore: React.FC = () => {
  const { db, go, coords, locStatus, distanceTo, requestLocation, demoLabel, setDemoLocation, stopEligibility, isFavorite } = useAloha();
  const h = useHelpers();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [filters, setFilters] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLocSheet, setShowLocSheet] = useState(false);
  const [checkStopId, setCheckStopId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const toggle = (id: string) => setFilters((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const liveDropStops = useMemo(() => new Set(db.drops.filter((d) => d.status === 'live').map((d) => d.stop_id)), [db.drops]);
  const activeHuntStops = useMemo(() => {
    const activeIds = new Set(db.hunts.filter((x) => x.status === 'active').map((x) => x.id));
    return new Set(db.huntStops.filter((hs) => activeIds.has(hs.hunt_id)).map((hs) => hs.stop_id));
  }, [db.hunts, db.huntStops]);

  const visible = useMemo(() => {
    let list = db.stops.filter((s) => s.status === 'approved');
    const cats = filters.filter((f) => f.startsWith('cat_'));
    if (cats.length) list = list.filter((s) => cats.includes(s.category_id));
    if (filters.includes('rewards')) list = list.filter((s) => db.rewards.some((r) => r.stop_id === s.id && r.status === 'approved'));
    if (filters.includes('passport')) list = list.filter((s) => !!s.passport_stamp_id);
    if (filters.includes('drops')) list = list.filter((s) => liveDropStops.has(s.id));
    if (filters.includes('hunts')) list = list.filter((s) => activeHuntStops.has(s.id));
    if (filters.includes('saved')) list = list.filter((s) => isFavorite('stop', s.id));
    if (filters.includes('inrange')) list = list.filter((s) => stopEligibility(s).inRange);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q)
        || (h.region(s.region_id)?.name ?? '').toLowerCase().includes(q)
        || (h.category(s.category_id)?.name ?? '').toLowerCase().includes(q));
    }
    if (filters.includes('nearby') && coords) {
      list = list.filter((s) => (distanceTo(s.coords) ?? 1e9) < 12000);
    }
    return list.sort((a, b) => (distanceTo(a.coords) ?? 1e9) - (distanceTo(b.coords) ?? 1e9));
  }, [db.stops, db.rewards, filters, query, coords, distanceTo, liveDropStops, activeHuntStops, h, isFavorite, stopEligibility]);

  const inRangeIds = useMemo(() => new Set(visible.filter((s) => stopEligibility(s).inRange).map((s) => s.id)), [visible, stopEligibility, nowTick]);
  const approachingIds = useMemo(() => new Set(visible.filter((s) => {
    const e = stopEligibility(s);
    return !e.inRange && !e.interactionCooling && isApproachingStop(coords, s.coords, s.geofence_m, distanceTo(s.coords));
  }).map((s) => s.id)), [visible, stopEligibility, coords, distanceTo, nowTick]);
  const cooldownIds = useMemo(() => new Set(visible.filter((s) => stopEligibility(s).interactionCooling).map((s) => s.id)), [visible, stopEligibility, nowTick]);
  const inRangeStop = useMemo(
    () => visible.find((s) => { const e = stopEligibility(s); return e.inRange && e.canInteract; }) ?? null,
    [visible, stopEligibility, nowTick],
  );

  const openStop = (id: string) => {
    const s = db.stops.find((x) => x.id === id);
    if (!s) return;
    const e = stopEligibility(s);
    if (e.inRange && e.canInteract) {
      setSelected(null);
      setCheckStopId(id);
      return;
    }
    setSelected(id);
  };
  const cooldownUntil = useMemo(() => {
    const rec: Record<string, string> = {};
    visible.forEach((s) => {
      const e = stopEligibility(s);
      if (e.interactionCooling && e.interactionReadyAt) rec[s.id] = e.interactionReadyAt.toISOString();
    });
    return rec;
  }, [visible, stopEligibility, nowTick]);
  const ownedStamps = useMemo(() => new Set(db.stamps.map((s) => s.stamp_id)), [db.stamps]);
  const passportStopIds = useMemo(
    () => new Set(visible.filter((s) => s.passport_stamp_id && !ownedStamps.has(s.passport_stamp_id)).map((s) => s.id)),
    [visible, ownedStamps],
  );
  const rewardStopIds = useMemo(
    () => new Set(visible.filter((s) => db.rewards.some((r) => r.stop_id === s.id && r.status === 'approved')).map((s) => s.id)),
    [visible, db.rewards],
  );

  const questHint = useMemo(() => {
    const here = visible.find((s) => {
      const e = stopEligibility(s);
      return e.inRange && e.canInteract;
    });
    if (here) {
      return { icon: 'Sparkles', eyebrow: '🌺 Aloha Stop in range', text: `Tap ${here.name} to collect.`, onClick: () => { setSelected(null); setCheckStopId(here.id); } };
    }

    const nearbyDrop = db.drops
      .filter((d) => d.status === 'live')
      .map((d) => {
        const stop = db.stops.find((s) => s.id === d.stop_id);
        return { d, stop, dist: stop ? distanceTo(stop.coords) : null };
      })
      .filter((x) => x.stop && x.dist != null && x.dist < 9000)
      .sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9))[0];
    if (nearbyDrop?.d) {
      return { icon: 'Zap', eyebrow: 'Aloha Drop nearby', text: `There's an Aloha Drop nearby! ${nearbyDrop.d.title}`, onClick: () => go({ name: 'drop', id: nearbyDrop.d.id }) };
    }

    const huntHint = db.huntProgress
      .filter((p) => p.status === 'in_progress')
      .map((p) => {
        const hunt = db.hunts.find((x) => x.id === p.hunt_id);
        const req = db.huntStops.filter((hs) => hs.hunt_id === p.hunt_id && hs.required);
        const left = req.filter((hs) => !p.completed_stop_ids.includes(hs.stop_id)).length;
        return { hunt, left, total: req.length };
      })
      .filter((x) => x.hunt && x.left > 0)
      .sort((a, b) => a.left - b.left)[0];
    if (huntHint?.hunt && huntHint.left <= 3) {
      return {
        icon: 'Flag',
        eyebrow: huntHint.hunt.name,
        text: huntHint.left === 1 ? 'One more Stop to finish this Hunt.' : `We only need ${huntHint.left} more Stops to finish this Hunt.`,
        onClick: () => go({ name: 'hunt', id: huntHint.hunt!.id }),
      };
    }

    const regionAlmost = db.regions
      .map((r) => {
        const defs = db.stampDefs.filter((d) => d.region_id === r.id);
        const got = defs.filter((d) => ownedStamps.has(d.id)).length;
        return { r, got, left: defs.length - got };
      })
      .filter((x) => x.got > 0 && x.left > 0 && x.left <= 2)
      .sort((a, b) => a.left - b.left)[0];
    if (regionAlmost) {
      return {
        icon: 'Stamp',
        eyebrow: `${regionAlmost.r.name} Passport`,
        text: `We're almost done with our ${regionAlmost.r.name} Passport.`,
        onClick: () => go({ name: 'region', id: regionAlmost.r.id }),
      };
    }

    const next = visible.find((s) => {
      const e = stopEligibility(s);
      return !e.interactionCooling;
    });
    if (next) {
      return { icon: 'MapPin', eyebrow: 'Aloha Stop nearby', text: "There's an Aloha Stop over there. Let's go get it.", onClick: () => setSelected(next.id) };
    }
    return null;
  }, [visible, stopEligibility, db.drops, db.stops, db.huntProgress, db.hunts, db.huntStops, db.regions, db.stampDefs, ownedStamps, distanceTo, go]);

  const selectedStop = selected ? db.stops.find((s) => s.id === selected) : null;
  const checkStop = checkStopId ? db.stops.find((s) => s.id === checkStopId) : null;
  const nearestRegion = useMemo(() => {
    if (!visible.length) {
      const alt = db.stops.filter((s) => s.status === 'approved')[0];
      return alt ? h.region(alt.region_id)?.name : null;
    }
    return null;
  }, [visible, db.stops, h]);

  const refresh = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 700);
  };

  return (
    <div className={cn('relative min-w-0', view === 'map' ? 'absolute inset-0 overflow-hidden' : 'min-h-full')}>
      {view === 'map' ? (
        <MapCanvas
          stops={visible}
          drops={db.drops}
          huntStopIds={activeHuntStops}
          selectedId={selected}
          userCoords={coords}
          onSelect={openStop}
          categoryIcon={(cid) => h.category(cid)?.icon ?? 'MapPin'}
          regionLabels={db.regions.map((r) => ({ name: r.name, center: r.center }))}
          inRangeIds={inRangeIds}
          approachingIds={approachingIds}
          cooldownIds={cooldownIds}
          cooldownUntil={cooldownUntil}
          passportStopIds={passportStopIds}
          rewardStopIds={rewardStopIds}
        />
      ) : (
        <div className="bg-[#FBF7F0] pb-8 pt-[168px]">
          <div className="space-y-3 px-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              : visible.map((s) => <StopRow key={s.id} stop={s} onClick={() => go({ name: 'stop', id: s.id })} />)}
            {!loading && !visible.length && (
              <div className="rounded-3xl border border-dashed border-[#0B4F6C]/20 bg-white p-8 text-center">
                <Icon name="MapPinOff" className="mx-auto mb-3 h-8 w-8 text-[#0B4F6C]/30" />
                <p className="text-[14px] font-extrabold text-[#062B3F]">No Aloha Stops match yet</p>
                <p className="mt-1 text-[12.5px] text-[#0B4F6C]/60">
                  Try clearing filters{nearestRegion ? ` or explore ${nearestRegion} instead` : ''}.
                </p>
                <Btn size="sm" variant="outline" className="mt-4" onClick={() => { setFilters([]); setQuery(''); }}>Clear filters</Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* top glass overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="pointer-events-auto px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-3 shadow-[0_14px_36px_-18px_rgba(3,26,39,.55)] backdrop-blur-xl ring-1 ring-black/5">
              <Icon name="Search" className="h-[18px] w-[18px] shrink-0 text-[#0B4F6C]/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where do you want to explore?"
                className="w-full bg-transparent text-[14px] font-semibold text-[#062B3F] outline-none placeholder:font-medium placeholder:text-[#0B4F6C]/40"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear"><Icon name="X" className="h-4 w-4 text-[#0B4F6C]/40" /></button>
              )}
            </div>
            <PointsBadge onClick={() => go({ name: 'points' })} className="py-3" />
          </div>

          <div className="mt-2.5 flex min-w-0 items-center gap-2">
            <div className="flex gap-1 rounded-2xl bg-white/95 p-1 shadow-lg ring-1 ring-black/5">
              {(['map', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setView(v); if (v === 'list') refresh(); }}
                  className={cn('rounded-xl px-3 py-1.5 text-[12px] font-bold transition', view === v ? 'bg-[#0B4F6C] text-white' : 'text-[#0B4F6C]/60')}
                >
                  <Icon name={v === 'map' ? 'Map' : 'List'} className="mr-1 inline h-3.5 w-3.5" />{v === 'map' ? 'Map' : 'List'}
                </button>
              ))}
            </div>
            <div className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {FILTERS.map((f) => (
                <Chip key={f.id} icon={f.icon} active={filters.includes(f.id)} tone={f.id === 'drops' ? 'coral' : f.id === 'passport' ? 'gold' : 'default'} onClick={() => toggle(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>

          {locStatus === 'denied' && (
            <button onClick={() => setShowLocSheet(true)} className="pointer-events-auto mt-2.5 flex w-full items-start gap-2.5 rounded-2xl bg-[#062B3F]/92 p-3 text-left text-white backdrop-blur ring-1 ring-white/10">
              <Icon name="LocateOff" className="mt-0.5 h-4 w-4 shrink-0 text-[#FF9E4A]" />
              <span className="flex-1 text-[12px] font-semibold leading-snug">
                Location is off. You can still explore Oʻahu. Enable location to see nearby Stops and verify visits.
              </span>
              <span className="shrink-0 text-[11px] font-black uppercase tracking-wide text-[#8FE3DC]">Fix</span>
            </button>
          )}
          {locStatus === 'demo' && (
            <button onClick={() => setShowLocSheet(true)} className="pointer-events-auto mt-2.5 flex w-full items-center gap-2 rounded-2xl bg-[#D4A853]/95 px-3 py-2 text-left text-[#3A2A05] shadow-lg">
              <Icon name="FlaskConical" className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-[11.5px] font-bold">Demo location: {demoLabel}</span>
              <Icon name="ChevronRight" className="h-4 w-4" />
            </button>
          )}
          {locStatus === 'unknown' && (
            <button onClick={requestLocation} className="pointer-events-auto mt-2.5 flex w-full items-center gap-2 rounded-2xl bg-white/95 px-3 py-2.5 text-left shadow-lg ring-1 ring-black/5">
              <Icon name="LocateFixed" className="h-4 w-4 shrink-0 text-[#1FA9A3]" />
              <span className="flex-1 text-[12px] font-bold text-[#062B3F]">Use my location to sort by distance</span>
              <span className="text-[11px] font-black uppercase text-[#1FA9A3]">Allow</span>
            </button>
          )}
        </div>
      </div>

      {/* live drop pill + surprise me FAB */}
      {view === 'map' && (
        <>
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {inRangeStop && !selectedStop && !checkStop && (
                <button
                  onClick={() => openStop(inRangeStop.id)}
                  className="flex w-full max-w-[320px] items-center gap-3 rounded-3xl bg-gradient-to-br from-[#E7C577] to-[#1FA9A3] px-3.5 py-3 text-left text-[#062B3F] shadow-[0_18px_40px_-16px_rgba(31,169,163,.95)] ring-2 ring-white/70"
                  style={{ animation: 'ah-approach-pulse 1.8s ease-in-out infinite' }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#031A27] text-white">
                    <Icon name="Sparkles" className="h-5 w-5 text-[#E7C577]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[#3A2A05]">🌺 Aloha Stop in range!</span>
                    <span className="block truncate text-[16px] font-black leading-tight">{inRangeStop.name}</span>
                    <span className="block text-[12px] font-extrabold text-[#062B3F]/75">Tap to collect</span>
                  </span>
                </button>
              )}
              {questHint && !selectedStop && !inRangeStop && (
                <button onClick={questHint.onClick} className="flex w-full max-w-[280px] items-start gap-2 rounded-2xl bg-[#031A27]/88 px-3 py-2.5 text-left text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1FA9A3]/25"><Icon name={questHint.icon} className="h-3.5 w-3.5 text-[#8FE3DC]" /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#8FE3DC]">{questHint.eyebrow}</span>
                    <span className="block text-[12.5px] font-extrabold leading-snug">{questHint.text}</span>
                  </span>
                </button>
              )}
              {db.drops.filter((d) => d.status === 'live').slice(0, 1).map((d) => (
                <button key={d.id} onClick={() => go({ name: 'drop', id: d.id })} className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] px-3 py-2.5 text-left text-white shadow-[0_16px_36px_-16px_rgba(255,111,89,.9)]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25"><Icon name="Zap" className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/85">Aloha Drop live</span>
                    <span className="block text-[12.5px] font-extrabold">{d.title}</span>
                  </span>
                </button>
              ))}
              <MapLegend />
            </div>
            <button
              onClick={() => go({ name: 'surprise' })}
              className="relative flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#1FA9A3] to-[#0B4F6C] text-white shadow-[0_20px_40px_-16px_rgba(11,79,108,.95)] transition active:scale-95"
            >
              <span className="absolute inset-0 animate-ping rounded-3xl bg-[#1FA9A3]/25" />
              <Icon name="Sparkles" className="relative h-6 w-6 text-[#E7C577]" />
              <span className="relative mt-0.5 text-[9px] font-black uppercase tracking-wider">Surprise</span>
            </button>
          </div>
        </>
      )}

      {/* selected stop bottom sheet */}
      <Sheet open={!!selectedStop} onClose={() => setSelected(null)} label="Aloha Stop preview">
        {selectedStop && (
          <StopPreview
            stop={selectedStop}
            onOpen={() => { const id = selectedStop.id; setSelected(null); go({ name: 'stop', id }); }}
            onCollect={() => { const id = selectedStop.id; setSelected(null); setCheckStopId(id); }}
          />
        )}
      </Sheet>
      {checkStop && <CheckIn stop={checkStop} open={!!checkStop} onClose={() => setCheckStopId(null)} />}

      {/* location settings sheet */}
      <Sheet open={showLocSheet} onClose={() => setShowLocSheet(false)} label="Location options">
        <div className="px-5 pb-4 pt-3">
          <h3 className="text-[18px] font-black text-[#062B3F]">Location &amp; demo simulation</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#0B4F6C]/65">
            Production uses high-accuracy device GPS, requested only when you open nearby discovery or verify a visit.
            Preview builds fall back to a controlled demo position so the full flow stays testable.
          </p>
          <Btn full variant="secondary" className="mt-4" icon="LocateFixed" onClick={() => { requestLocation(); setShowLocSheet(false); }}>
            Request device location
          </Btn>
          <p className="mb-2 mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#0B4F6C]/45">Demo location simulation</p>
          <div className="space-y-2">
            {DEMO_LOCATIONS.map((l) => (

              <button
                key={l.id}
                onClick={() => { setDemoLocation(l.coords, l.label); setShowLocSheet(false); }}
                className={cn('flex w-full items-center gap-2.5 rounded-2xl border bg-white p-3.5 text-left transition',
                  demoLabel === l.label ? 'border-[#1FA9A3] ring-2 ring-[#1FA9A3]/20' : 'border-black/8')}
              >
                <Icon name="MapPin" className="h-4 w-4 text-[#1FA9A3]" />
                <span className="flex-1 text-[13.5px] font-bold text-[#062B3F]">{l.label}</span>
                {demoLabel === l.label && <Icon name="Check" className="h-4 w-4 text-[#1FA9A3]" />}
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
};

const MapLegend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-2xl bg-[#031A27]/75 px-3 py-2 backdrop-blur ring-1 ring-white/10">
    {[
      ['#1FA9A3', 'Available'],
      ['#6B8A99', 'Too far'],
      ['#6B7C86', 'Cooldown'],
      ['#D4A853', 'Hunt'],
      ['#C9A227', 'Passport'],
      ['#FF6F59', 'Drop'],
      ['#FF8A7A', 'Reward'],
    ].map(([c, l]) => (
      <span key={l} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/80">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}
      </span>
    ))}
  </div>
);

const StopPreview: React.FC<{ stop: AlohaStop; onOpen: () => void; onCollect: () => void }> = ({ stop, onOpen, onCollect }) => {
  const { db, distanceTo, stopEligibility, coords } = useAloha();
  const h = useHelpers();
  const open = stopIsOpen(stop);
  const drop = db.drops.find((d) => d.stop_id === stop.id && d.status === 'live');
  const reward = db.rewards.find((r) => r.stop_id === stop.id && r.status === 'approved');
  const huntStop = db.huntStops.find((hs) => hs.stop_id === stop.id);
  const hunt = huntStop ? db.hunts.find((x) => x.id === huntStop.hunt_id) : undefined;
  const elig = stopEligibility(stop);
  return (
    <div className="px-4 pb-3 pt-2">
      <div className="relative overflow-hidden rounded-3xl">
        <img src={stop.images[0]} alt={stop.name} className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#031A27]/80 to-transparent" />
        <SaveButton type="stop" id={stop.id} floating className="absolute right-3 top-3" />
        {drop && <div className="absolute left-3 top-3"><Pill tone="coral" icon="Zap">Aloha Drop live</Pill></div>}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-[21px] font-black leading-tight text-white">{stop.name}</h3>
          <p className="text-[12.5px] font-semibold text-white/80">
            {h.category(stop.category_id)?.name} · {h.region(stop.region_id)?.name} · {formatDistance(distanceTo(stop.coords))}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[12.5px] font-bold">
        <span className={cn('inline-flex items-center gap-1.5', open ? 'text-[#2F855A]' : 'text-[#B23D2A]')}>
          <span className={cn('h-2 w-2 rounded-full', open ? 'bg-[#2F855A]' : 'bg-[#B23D2A]')} />{open ? 'Open now' : 'Closed'}
        </span>
        <span className="text-[#0B4F6C]/30">·</span>
        <span className="text-[#0B4F6C]/60">{hoursLabel(stop)}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[#062B3F]"><Icon name="Star" className="h-3.5 w-3.5 fill-[#D4A853] text-[#D4A853]" />{stop.rating}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[#0B4F6C]/6 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/50">Earn here</p>
          <p className="mt-0.5 text-[16px] font-black text-[#062B3F]">+{h.pointsFor(stop)} pts</p>
        </div>
        <div className="rounded-2xl bg-[#D4A853]/12 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#8A6414]">Passport</p>
          <p className="mt-0.5 text-[13px] font-extrabold text-[#062B3F]">
            {stop.passport_stamp_id ? `${h.region(stop.region_id)?.name} stamp` : 'No stamp here'}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {elig.inRange && elig.canInteract && <Pill tone="gold" icon="Sparkles">Available — collect</Pill>}
        {!elig.inRange && coords && !elig.interactionCooling && <Pill tone="slate" icon="Lock">Too far away</Pill>}
        {elig.interactionCooling && <Pill tone="dark" icon="Clock">Cooldown</Pill>}
        {hunt && <Pill tone="aqua" icon="Flag">Hunt Stop</Pill>}
        {stop.passport_stamp_id && <Pill tone="gold" icon="Stamp">Passport Stop</Pill>}
        {drop && <Pill tone="coral" icon="Zap">Active Aloha Drop</Pill>}
        {reward && <Pill tone="coral" icon="Gift">Reward available</Pill>}
      </div>

      {elig.interactionCooling && elig.interactionReadyAt && (
        <div className="mt-3 rounded-2xl bg-[#062B3F] px-3 py-2.5 text-center text-white">
          <CooldownClock until={elig.interactionReadyAt} prefix="Available again in " className="text-[14px] font-black text-[#E7C577]" />
        </div>
      )}
      {elig.inRange && !elig.interactionCooling && (
        <p className="mt-3 text-center text-[14px] font-black text-[#1FA9A3]">🌺 Aloha Stop in range! Tap Collect</p>
      )}
      {!elig.inRange && coords && !elig.interactionCooling && (
        <p className="mt-3 text-center text-[12px] font-bold text-[#0B4F6C]/60">
          {isApproachingStop(coords, stop.coords, stop.geofence_m, distanceTo(stop.coords))
            ? 'Getting close — keep walking until it glows'
            : `Walk within ${stop.geofence_m} m to activate this Stop`}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Btn full size="lg" variant={elig.inRange && elig.canInteract ? 'coral' : 'primary'} icon={elig.interactionCooling ? 'Clock' : elig.inRange ? 'Sparkles' : 'MapPin'}
          onClick={onCollect}>
          {elig.interactionCooling ? 'Cooling down' : elig.inRange ? 'You’re here — Collect' : 'Get closer'}
        </Btn>
        <Btn size="lg" variant="outline" icon="ArrowRight" onClick={onOpen}>View</Btn>
      </div>
    </div>
  );
};

export default Explore;
