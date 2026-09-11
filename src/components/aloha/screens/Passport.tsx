import React, { useMemo } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Bar, Card, HeaderBar, Icon, Pill, ProgressRing, SectionTitle } from '../kit';
import { PointsBadge, useHelpers } from '../cards';
import { cn } from '@/lib/utils';

export const PassportScreen: React.FC = () => {
  const { db, go } = useAloha();
  const island = db.islands.find((i) => i.id === db.user.island_id)!;
  const defs = db.stampDefs.filter((s) => s.island_id === island.id);
  const owned = new Set(db.stamps.map((s) => s.stamp_id));
  const pct = Math.round((defs.filter((d) => owned.has(d.id)).length / defs.length) * 100);
  const collected = defs.filter((d) => owned.has(d.id)).length;

  const regionRows = useMemo(() => db.regions.filter((r) => r.island_id === island.id).map((r) => {
    const rDefs = defs.filter((d) => d.region_id === r.id);
    const rOwned = rDefs.filter((d) => owned.has(d.id));
    return { region: r, total: rDefs.length, got: rOwned.length, pct: rDefs.length ? (rOwned.length / rDefs.length) * 100 : 0 };
  }), [db.regions, defs, island.id, owned]);

  const milestones = db.milestones.filter((m) => m.island_id === island.id);

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Island Passport" subtitle="Collect stamps across every region" right={<PointsBadge onClick={() => go({ name: 'points' })} />} />

      <div className="px-4">
        {/* island header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B4F6C] via-[#08405A] to-[#062B3F] p-5 text-white shadow-[0_24px_50px_-26px_rgba(6,43,63,.9)]">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#1FA9A3]/20 blur-2xl" />
          <div className="relative flex items-center gap-5">
            <ProgressRing value={pct} size={92} stroke={9} color="#D4A853" track="rgba(255,255,255,.16)">
              <div className="text-center">
                <div className="text-[20px] font-black leading-none">{pct}%</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">complete</div>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8FE3DC]">Hawaiʻi · Island Passport</p>
              <h2 className="text-[26px] font-black leading-tight">{island.name} Passport</h2>
              <p className="mt-0.5 text-[13px] font-bold text-white/75">{collected} / {defs.length} Stamps</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {db.islands.filter((i) => i.status === 'coming_soon').slice(0, 3).map((i) => (
                  <span key={i.id} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">{i.name} soon</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* milestones */}
        <div className="mt-5">
          <SectionTitle title="Milestone rewards" sub="Unlocked automatically by the ledger" />
          <div className="space-y-2">
            {milestones.map((m) => {
              const scope = m.region_id ? defs.filter((d) => d.region_id === m.region_id) : defs;
              const got = scope.filter((d) => owned.has(d.id)).length;
              const hit = got >= m.stamps_required;
              return (
                <div key={m.id} className={cn('flex items-center gap-3 rounded-2xl p-3.5 ring-1', hit ? 'bg-[#D4A853]/12 ring-[#D4A853]/30' : 'bg-white ring-black/5')}>
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', hit ? 'bg-gradient-to-br from-[#E7C577] to-[#D4A853]' : 'bg-[#0B4F6C]/8')}>
                    <Icon name={hit ? 'Award' : 'Lock'} className={cn('h-5 w-5', hit ? 'text-[#3A2A05]' : 'text-[#0B4F6C]/40')} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-extrabold text-[#062B3F]">{m.badge}</p>
                    <p className="text-[11.5px] font-semibold text-[#0B4F6C]/60">
                      {got}/{m.stamps_required} stamps · +{m.bonus_points.toLocaleString()} pts{m.partner_reward_id ? ' + partner reward' : ''}
                    </p>
                  </div>
                  {hit ? <Pill tone="gold">Earned</Pill> : <Bar value={(got / m.stamps_required) * 100} className="w-20" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* regions */}
        <div className="mt-6">
          <SectionTitle title="Regions" sub="Tap a region to open its stamp collection" />
          <div className="grid grid-cols-2 gap-3">
            {regionRows.map(({ region, total, got, pct: rp }) => (
              <button key={region.id} onClick={() => go({ name: 'region', id: region.id })}
                className="group rounded-3xl bg-white p-4 text-left ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-[#1FA9A3]/40">
                <div className="flex items-start justify-between">
                  <ProgressRing value={rp} size={54} stroke={6} color={rp === 100 ? '#2F855A' : '#1FA9A3'}>
                    <span className="text-[11px] font-black text-[#062B3F]">{got}/{total}</span>
                  </ProgressRing>
                  {rp === 100 && <Icon name="BadgeCheck" className="h-5 w-5 text-[#2F855A]" />}
                </div>
                <p className="mt-2.5 text-[14px] font-extrabold leading-tight text-[#062B3F]">{region.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[#0B4F6C]/55">{region.blurb}</p>
                <p className="mt-2 text-[11px] font-bold text-[#1FA9A3]">
                  {total - got === 0 ? 'Region complete' : `${total - got} stamp${total - got === 1 ? '' : 's'} remaining`}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* achievements */}
        <div className="mt-6">
          <SectionTitle title="Achievements" action="All" onAction={() => go({ name: 'achievements' })} />
          <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1">
            {db.milestones.map((m) => {
              const scope = m.region_id ? defs.filter((d) => d.region_id === m.region_id) : defs;
              const hit = scope.filter((d) => owned.has(d.id)).length >= m.stamps_required;
              return (
                <div key={m.id} className={cn('w-[130px] shrink-0 rounded-3xl p-3.5 text-center ring-1', hit ? 'bg-white ring-[#D4A853]/40' : 'bg-white/60 ring-black/5')}>
                  <span className={cn('mx-auto flex h-12 w-12 items-center justify-center rounded-full', hit ? 'bg-gradient-to-br from-[#E7C577] to-[#D4A853]' : 'bg-[#0B4F6C]/8')}>
                    <Icon name={hit ? 'Trophy' : 'Lock'} className={cn('h-5 w-5', hit ? 'text-[#3A2A05]' : 'text-[#0B4F6C]/35')} />
                  </span>
                  <p className="mt-2 text-[12px] font-extrabold leading-tight text-[#062B3F]">{m.badge}</p>
                  <p className="mt-0.5 text-[10.5px] text-[#0B4F6C]/50">{hit ? 'Earned' : `${m.stamps_required} stamps`}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegionDetail: React.FC<{ id: string }> = ({ id }) => {
  const { db, back, go } = useAloha();
  const h = useHelpers();
  const region = db.regions.find((r) => r.id === id);
  if (!region) return <div className="p-10 text-center">Region not found.</div>;
  const defs = db.stampDefs.filter((d) => d.region_id === id);
  const owned = new Set(db.stamps.map((s) => s.stamp_id));
  const got = defs.filter((d) => owned.has(d.id)).length;
  const stops = db.stops.filter((s) => s.region_id === id);

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title={`${region.name} Passport`} onBack={back} subtitle={`${got} of ${defs.length} stamps collected`} />
      <div className="px-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={(got / Math.max(1, defs.length)) * 100} size={68} stroke={7} color={got === defs.length ? '#2F855A' : '#1FA9A3'}>
              <span className="text-[13px] font-black text-[#062B3F]">{got}/{defs.length}</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-[13.5px] font-extrabold text-[#062B3F]">{region.name}</p>
              <p className="text-[12px] text-[#0B4F6C]/60">{region.blurb}</p>
            </div>
          </div>
        </Card>

        <SectionTitle className="mt-5" title="Stamp collection" sub="Collected stamps are embossed; locked stamps show the silhouette" />
        <div className="grid grid-cols-3 gap-3">
          {defs.map((d) => {
            const have = owned.has(d.id);
            const stamp = db.stamps.find((s) => s.stamp_id === d.id);
            return (
              <div key={d.id} className={cn('relative flex flex-col items-center rounded-3xl p-3 text-center ring-1',
                have ? 'bg-[#FFFDF7] ring-[#D4A853]/45 shadow-[inset_0_2px_10px_rgba(212,168,83,.22)]' : 'bg-white/55 ring-black/5')}>
                <span className={cn('flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed',
                  have ? 'border-[#8A6414]/55 bg-[#D4A853]/14' : 'border-[#0B4F6C]/12 bg-[#0B4F6C]/[.04]')}
                  style={have ? { transform: 'rotate(-7deg)' } : undefined}>
                  <Icon name={d.icon} className={cn('h-7 w-7', have ? 'text-[#8A6414]' : 'text-[#0B4F6C]/18')} />
                </span>
                <p className={cn('mt-2 text-[11.5px] font-extrabold leading-tight', have ? 'text-[#062B3F]' : 'text-[#0B4F6C]/40')}>{d.name}</p>
                <p className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#0B4F6C]/40">
                  {have && stamp ? new Date(stamp.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Locked'}
                </p>
                {d.stop_id && !have && (
                  <button onClick={() => go({ name: 'stop', id: d.stop_id! })} className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-[#1FA9A3]">
                    How to earn
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <SectionTitle className="mt-6" title={`Aloha Stops in ${region.name}`} />
        <div className="space-y-2">
          {stops.map((s) => (
            <button key={s.id} onClick={() => go({ name: 'stop', id: s.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5">
              <img src={s.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{s.name}</span>
                <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/60">{h.category(s.category_id)?.name} · +{h.pointsFor(s)} pts</span>
              </span>
              {s.passport_stamp_id && owned.has(s.passport_stamp_id)
                ? <Icon name="BadgeCheck" className="h-5 w-5 text-[#2F855A]" />
                : <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/30" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
