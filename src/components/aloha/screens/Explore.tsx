import React, { useMemo, useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import MapCanvas from '../MapCanvas';
import { Btn, Chip, Icon, Pill, Sheet, Skeleton } from '../kit';
import { PointsBadge, StopCard, StopRow, SaveButton, useHelpers } from '../cards';
import { formatDistance } from '@/lib/geo';
import { hoursLabel, stopIsOpen } from '@/lib/recommend';
import { cn } from '@/lib/utils';
import { AlohaStop } from '@/data/types';
import { DEMO_LOCATIONS } from '@/data/seed';


const FILTERS = [
  { id: 'nearby', label: 'Nearby', icon: 'LocateFixed' },
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
  const { db, go, coords, locStatus, distanceTo, requestLocation, demoLabel, setDemoLocation } = useAloha();
  const h = useHelpers();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [filters, setFilters] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLocSheet, setShowLocSheet] = useState(false);

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
  }, [db.stops, db.rewards, filters, query, coords, distanceTo, liveDropStops, h]);

  const selectedStop = selected ? db.stops.find((s) => s.id === selected) : null;
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
          onSelect={(id) => setSelected(id)}
          categoryIcon={(cid) => h.category(cid)?.icon ?? 'MapPin'}
          regionLabels={db.regions.map((r) => ({ name: r.name, center: r.center }))}
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
            <div className="space-y-2">
              {db.drops.filter((d) => d.status === 'live').slice(0, 1).map((d) => (
                <button key={d.id} onClick={() => go({ name: 'drop', id: d.id })} className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] px-3 py-2.5 text-left text-white shadow-[0_16px_36px_-16px_rgba(255,111,89,.9)]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25"><Icon name="Zap" className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/85">Aloha Drop live</span>
                    <span className="block text-[12.5px] font-extrabold">{d.title}</span>
                  </span>
                </button>
              ))}
              <div className="flex gap-2">
                <MapLegend />
              </div>
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
        {selectedStop && <StopPreview stop={selectedStop} onOpen={() => { const id = selectedStop.id; setSelected(null); go({ name: 'stop', id }); }} />}
      </Sheet>

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
  <div className="flex items-center gap-2.5 rounded-2xl bg-[#031A27]/75 px-3 py-2 backdrop-blur ring-1 ring-white/10">
    {[
      ['#1FA9A3', 'Stops'],
      ['#D4A853', 'Hunts'],
      ['#FF6F59', 'Drops'],
    ].map(([c, l]) => (
      <span key={l} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/80">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}
      </span>
    ))}
  </div>
);

const StopPreview: React.FC<{ stop: AlohaStop; onOpen: () => void }> = ({ stop, onOpen }) => {
  const { db, distanceTo } = useAloha();
  const h = useHelpers();
  const open = stopIsOpen(stop);
  const drop = db.drops.find((d) => d.stop_id === stop.id && d.status === 'live');
  const reward = db.rewards.find((r) => r.stop_id === stop.id && r.status === 'approved');
  const huntStop = db.huntStops.find((hs) => hs.stop_id === stop.id);
  const hunt = huntStop ? db.hunts.find((x) => x.id === huntStop.hunt_id) : undefined;
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
        {reward && <Pill tone="coral" icon="Gift">{reward.point_cost} pt reward</Pill>}
        {hunt && <Pill tone="aqua" icon="Flag">{hunt.name}</Pill>}
        {drop && <Pill tone="gold" icon="Zap">+{drop.points} drop bonus</Pill>}
      </div>

      <Btn full size="lg" variant="primary" className="mt-4" icon="ArrowRight" onClick={onOpen}>View Aloha Stop</Btn>
    </div>
  );
};

export default Explore;
