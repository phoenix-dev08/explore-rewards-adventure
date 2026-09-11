import React from 'react';
import { AlohaDrop, AlohaStop, Hunt, Reward } from '@/data/types';
import { useAloha } from '@/store/AlohaStore';
import { Bar, Btn, Card, Countdown, Icon, Pill, Points } from './kit';
import { formatDistance } from '@/lib/geo';
import { hoursLabel, stopIsOpen } from '@/lib/recommend';
import { rewardAvailability } from '@/lib/engine';
import { cn } from '@/lib/utils';

export const useHelpers = () => {
  const { db } = useAloha();
  return {
    category: (id: string) => db.categories.find((c) => c.id === id),
    region: (id: string) => db.regions.find((r) => r.id === id),
    stop: (id: string) => db.stops.find((s) => s.id === id),
    business: (id: string) => db.businesses.find((b) => b.id === id),
    pointsFor: (stop: AlohaStop) => db.pointRules.find((r) => r.id === stop.point_rule_id)?.points ?? 0,
  };
};

export const SaveButton: React.FC<{ type: 'stop' | 'hunt' | 'reward'; id: string; className?: string; floating?: boolean }> = ({ type, id, className, floating }) => {
  const { isFavorite, toggleFavorite } = useAloha();
  const saved = isFavorite(type, id);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleFavorite(type, id); }}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition active:scale-90',
        floating ? 'bg-white/90 shadow-lg backdrop-blur' : 'bg-white ring-1 ring-black/5',
        className,
      )}
    >
      <Icon name="Heart" className={cn('h-[18px] w-[18px] transition', saved ? 'fill-[#FF6F59] text-[#FF6F59]' : 'text-[#0B4F6C]/55')} />
    </button>
  );
};

export const StopCard: React.FC<{ stop: AlohaStop; onClick: () => void; showDrop?: boolean; horizontal?: boolean }> = ({ stop, onClick, showDrop, horizontal }) => {
  const { db, distanceTo } = useAloha();
  const h = useHelpers();
  const cat = h.category(stop.category_id);
  const open = stopIsOpen(stop);
  const drop = db.drops.find((d) => d.stop_id === stop.id && d.status === 'live');
  const reward = db.rewards.find((r) => r.stop_id === stop.id && r.status === 'approved');
  const huntStop = db.huntStops.find((hs) => hs.stop_id === stop.id);
  const hunt = huntStop ? db.hunts.find((x) => x.id === huntStop.hunt_id && x.status === 'active') : undefined;

  return (
    <Card
      onClick={onClick}
      className={cn('group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(6,43,63,.25)]', horizontal ? 'flex w-[270px] shrink-0 flex-col' : '')}
    >
      <div className="relative">
        <img src={stop.images[0]} alt={stop.name} loading="lazy" className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#031A27]/70 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {showDrop && drop && <Pill tone="coral" icon="Zap">Aloha Drop</Pill>}
          {stop.featured && !drop && <Pill tone="dark" icon="Star">Featured</Pill>}
        </div>
        <SaveButton type="stop" id={stop.id} floating className="absolute right-3 top-3" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-[15px] font-extrabold text-white drop-shadow">{stop.name}</h4>
            <p className="truncate text-[11.5px] font-semibold text-white/80">{cat?.name} · {h.region(stop.region_id)?.name}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black text-[#062B3F]">
            +{h.pointsFor(stop)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3.5 py-3">
        <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-bold', open ? 'text-[#2F855A]' : 'text-[#B23D2A]')}>
          <span className={cn('h-1.5 w-1.5 rounded-full', open ? 'bg-[#2F855A]' : 'bg-[#B23D2A]')} />
          {open ? 'Open now' : 'Closed'}
        </span>
        <span className="text-[11.5px] text-[#0B4F6C]/45">·</span>
        <span className="truncate text-[11.5px] font-semibold text-[#0B4F6C]/65">{formatDistance(distanceTo(stop.coords))}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {stop.passport_stamp_id && <Icon name="Stamp" className="h-4 w-4 text-[#D4A853]" />}
          {reward && <Icon name="Gift" className="h-4 w-4 text-[#FF6F59]" />}
          {hunt && <Icon name="Flag" className="h-4 w-4 text-[#1FA9A3]" />}
        </div>
      </div>
    </Card>
  );
};

export const HuntCard: React.FC<{ hunt: Hunt; onClick: () => void; horizontal?: boolean }> = ({ hunt, onClick, horizontal }) => {
  const { db } = useAloha();
  const h = useHelpers();
  const stops = db.huntStops.filter((hs) => hs.hunt_id === hunt.id);
  const prog = db.huntProgress.find((p) => p.hunt_id === hunt.id);
  const done = prog?.completed_stop_ids.length ?? 0;
  const required = stops.filter((s) => s.required).length;
  const pct = required ? Math.min(100, (done / required) * 100) : 0;

  return (
    <Card onClick={onClick} className={cn('group cursor-pointer overflow-hidden transition hover:-translate-y-0.5', horizontal && 'w-[300px] shrink-0')}>
      <div className="relative h-36">
        <img src={hunt.hero} alt={hunt.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#031A27]/85 via-[#031A27]/20 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {hunt.sponsored_by && <Pill tone="gold" icon="BadgeCheck">Sponsored</Pill>}
          {hunt.status === 'upcoming' && <Pill tone="dark" icon="Clock">Coming soon</Pill>}
          {prog?.status === 'completed' && <Pill tone="green" icon="Check">Completed</Pill>}
        </div>
        <SaveButton type="hunt" id={hunt.id} floating className="absolute right-3 top-3" />
        <div className="absolute bottom-3 left-3.5 right-3.5">
          <h4 className="text-[16px] font-black uppercase tracking-wide text-white drop-shadow">{hunt.name}</h4>
          <p className="mt-0.5 text-[11.5px] font-semibold text-white/80">{h.region(hunt.region_id)?.name} · {stops.length} stops · {Math.round(hunt.est_minutes / 60)}h</p>
        </div>
      </div>
      <div className="px-3.5 pb-3.5 pt-3">
        <div className="mb-2 flex items-center justify-between text-[12px] font-bold">
          <span className="text-[#0B4F6C]/70">{done} of {required} complete</span>
          <span className="text-[#D4A853]">+{hunt.completion_points.toLocaleString()} pts</span>
        </div>
        <Bar value={pct} color={pct === 100 ? '#2F855A' : '#1FA9A3'} />
      </div>
    </Card>
  );
};

export const DropCard: React.FC<{ drop: AlohaDrop; onClick: () => void }> = ({ drop, onClick }) => {
  const { db, distanceTo } = useAloha();
  const stop = db.stops.find((s) => s.id === drop.stop_id);
  const remaining = drop.quantity_total - drop.quantity_claimed;
  const claimed = db.dropClaims.some((c) => c.drop_id === drop.id);
  if (!stop) return null;
  return (
    <button onClick={onClick} className="group w-full text-left">
      <div className="relative overflow-hidden rounded-3xl border border-[#FF9E4A]/30 bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] p-[1.5px] shadow-[0_18px_40px_-24px_rgba(255,111,89,.9)]">
        <div className="relative overflow-hidden rounded-[22px] bg-[#062B3F]">
          <img src={stop.images[0]} alt={stop.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-700 group-hover:scale-105" />
          <div className="relative p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#B23D2A]">
                <Icon name="Zap" className="h-3 w-3" /> Aloha Drop
              </span>
              {drop.status === 'live'
                ? <span className="rounded-full bg-[#FF6F59] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">Today only</span>
                : <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">Scheduled</span>}
            </div>
            <h4 className="text-[17px] font-black text-white">{drop.title}</h4>
            <p className="mt-0.5 text-[12px] font-semibold text-white/75">{stop.name} · {formatDistance(distanceTo(stop.coords))}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-white/95 px-2.5 py-1.5 text-[12px] font-black text-[#062B3F]">+{drop.points} pts</span>
              {drop.reward_label && <span className="rounded-xl bg-white/15 px-2.5 py-1.5 text-[11.5px] font-bold text-white backdrop-blur">{drop.reward_label}</span>}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11.5px] font-bold text-white/85">
              <span>{claimed ? 'Claimed by you' : `${remaining} / ${drop.quantity_total} remaining`}</span>
              {drop.status === 'live'
                ? <Countdown to={drop.ends_at} prefix="Ends in " />
                : <span>Starts {new Date(drop.starts_at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric' })}</span>}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export const RewardCard: React.FC<{ reward: Reward; onClick: () => void; horizontal?: boolean }> = ({ reward, onClick, horizontal }) => {
  const { db } = useAloha();
  const h = useHelpers();
  const av = rewardAvailability(
    { ...db } as never,
    reward,
  );
  const biz = h.business(reward.business_id);
  return (
    <Card onClick={onClick} className={cn('group cursor-pointer overflow-hidden transition hover:-translate-y-0.5', horizontal && 'w-[220px] shrink-0')}>
      <div className="relative">
        <img src={reward.image} alt={reward.name} loading="lazy" className="h-32 w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
        {reward.limited && (
          <div className="absolute left-2.5 top-2.5"><Pill tone="gold" icon="Sparkles">Limited</Pill></div>
        )}
        {av.soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#031A27]/65">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#B23D2A]">Sold out</span>
          </div>
        )}
        <SaveButton type="reward" id={reward.id} floating className="absolute right-2.5 top-2.5 h-8 w-8" />
      </div>
      <div className="p-3.5">
        <h4 className="text-[14px] font-extrabold leading-snug text-[#062B3F]">{reward.name}</h4>
        <p className="mt-0.5 truncate text-[11.5px] font-semibold text-[#0B4F6C]/60">{biz?.name}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#0B4F6C]/8 px-2.5 py-1 text-[12px] font-black text-[#0B4F6C]">
            <Icon name="Sparkles" className="h-3.5 w-3.5 text-[#D4A853]" />
            <Points value={reward.point_cost} /> pts
          </span>
          {!av.soldOut && av.remaining <= 20 && <span className="text-[11px] font-bold text-[#B23D2A]">{av.remaining} left</span>}
        </div>
      </div>
    </Card>
  );
};

export const StopRow: React.FC<{ stop: AlohaStop; onClick: () => void; right?: React.ReactNode; index?: number; done?: boolean }> = ({ stop, onClick, right, index, done }) => {
  const { distanceTo } = useAloha();
  const h = useHelpers();
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 text-left shadow-[0_10px_26px_-26px_rgba(6,43,63,.5)] transition hover:border-[#1FA9A3]/40 active:scale-[.99]">
      <div className="relative">
        <img src={stop.images[0]} alt={stop.name} loading="lazy" className="h-16 w-16 rounded-xl object-cover" />
        {index !== undefined && (
          <span className={cn('absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white ring-2 ring-white',
            done ? 'bg-[#2F855A]' : 'bg-[#0B4F6C]')}>
            {done ? <Icon name="Check" className="h-3.5 w-3.5" /> : index}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-[14.5px] font-extrabold text-[#062B3F]">{stop.name}</h4>
        <p className="truncate text-[12px] font-semibold text-[#0B4F6C]/60">{h.category(stop.category_id)?.name} · {formatDistance(distanceTo(stop.coords))}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-[#0B4F6C]/45">{hoursLabel(stop)}</p>
      </div>
      {right ?? <Icon name="ChevronRight" className="h-5 w-5 shrink-0 text-[#0B4F6C]/35" />}
    </button>
  );
};

export const Row: React.FC<{ icon: string; label: string; sub?: string; onClick?: () => void; right?: React.ReactNode; tone?: string }> = ({ icon, label, sub, onClick, right, tone = '#1FA9A3' }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#0B4F6C]/[.03]">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${tone}18` }}>
      <Icon name={icon} className="h-[18px] w-[18px]" style={{ color: tone } as React.CSSProperties} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[14.5px] font-bold text-[#062B3F]">{label}</span>
      {sub && <span className="block truncate text-[12px] text-[#0B4F6C]/55">{sub}</span>}
    </span>
    {right ?? <Icon name="ChevronRight" className="h-5 w-5 shrink-0 text-[#0B4F6C]/30" />}
  </button>
);

export const PointsBadge: React.FC<{ onClick?: () => void; className?: string }> = ({ onClick, className }) => {
  const { db, pointsPulse } = useAloha();
  return (
    <button
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#0B4F6C] to-[#062B3F] px-3 py-2 text-white shadow-[0_10px_24px_-14px_rgba(6,43,63,.9)] transition active:scale-95',
        className)}
      style={{ animation: pointsPulse ? 'ah-pop .5s ease' : undefined }}
      key={pointsPulse}
    >
      <Icon name="Sparkles" className="h-4 w-4 text-[#E7C577]" />
      <span className="text-[13px] font-black tabular-nums"><Points value={db.user.points_balance} /></span>
    </button>
  );
};
