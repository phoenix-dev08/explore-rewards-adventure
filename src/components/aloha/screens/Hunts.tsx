import React, { useMemo, useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Bar, Btn, Card, Chip, HeaderBar, Icon, Pill, ProgressRing, SectionTitle } from '../kit';
import { HuntCard, PointsBadge, SaveButton, StopRow } from '../cards';
import MapCanvas from '../MapCanvas';
import { useHelpers } from '../cards';

export const HuntsScreen: React.FC = () => {
  const { db, go } = useAloha();
  const [tabKey, setTabKey] = useState<'featured' | 'nearby' | 'progress' | 'done'>('featured');

  const progressById = useMemo(() => new Map(db.huntProgress.map((p) => [p.hunt_id, p])), [db.huntProgress]);

  const lists = useMemo(() => {
    const active = db.hunts.filter((h) => h.status !== 'ended');
    return {
      featured: active.filter((h) => h.featured),
      nearby: active.filter((h) => h.status === 'active'),
      progress: active.filter((h) => progressById.get(h.id)?.status === 'in_progress'),
      done: db.hunts.filter((h) => progressById.get(h.id)?.status === 'completed'),
    };
  }, [db.hunts, progressById]);

  const list = lists[tabKey];

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Hunts" subtitle="Multi-stop adventures across Oʻahu" right={<PointsBadge onClick={() => go({ name: 'points' })} />} />
      <div className="px-4">
        <div className="scrollbar-none -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pt-1">
          {([['featured', 'Featured'], ['nearby', 'Nearby'], ['progress', 'In Progress'], ['done', 'Completed']] as const).map(([k, label]) => (
            <Chip key={k} active={tabKey === k} onClick={() => setTabKey(k)}>
              {label} {lists[k].length ? `· ${lists[k].length}` : ''}
            </Chip>
          ))}
        </div>

        {tabKey === 'featured' && lists.progress[0] && (
          <div className="mb-5">
            <SectionTitle title="Continue your Hunt" />
            <FlagshipCard huntId={lists.progress[0].id} />
          </div>
        )}

        <div className="space-y-3">
          {list.map((h) => <HuntCard key={h.id} hunt={h} onClick={() => go({ name: 'hunt', id: h.id })} />)}
          {!list.length && (
            <Card className="p-8 text-center">
              <Icon name="Flag" className="mx-auto mb-3 h-8 w-8 text-[#0B4F6C]/25" />
              <p className="text-[14px] font-extrabold text-[#062B3F]">Nothing here yet</p>
              <p className="mt-1 text-[12.5px] text-[#0B4F6C]/60">Start a Hunt from Featured to see it appear here.</p>
              <Btn size="sm" variant="outline" className="mt-4" onClick={() => setTabKey('featured')}>Browse featured Hunts</Btn>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const FlagshipCard: React.FC<{ huntId: string }> = ({ huntId }) => {
  const { db, go } = useAloha();
  const hunt = db.hunts.find((h) => h.id === huntId)!;
  const stops = db.huntStops.filter((hs) => hs.hunt_id === huntId);
  const prog = db.huntProgress.find((p) => p.hunt_id === huntId);
  const required = stops.filter((s) => s.required);
  const done = required.filter((s) => prog?.completed_stop_ids.includes(s.stop_id)).length;
  const pct = (done / Math.max(1, required.length)) * 100;
  return (
    <button onClick={() => go({ name: 'hunt', id: huntId })} className="w-full overflow-hidden rounded-3xl bg-[#062B3F] text-left shadow-[0_22px_46px_-24px_rgba(6,43,63,.8)]">
      <div className="relative h-32">
        <img src={hunt.hero} alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#062B3F] via-[#062B3F]/60 to-transparent" />
        <div className="absolute inset-y-0 left-4 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8FE3DC]">In progress</span>
          <span className="max-w-[180px] text-[19px] font-black uppercase leading-tight text-white">{hunt.name}</span>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ProgressRing value={pct} size={72} stroke={7} color="#D4A853" track="rgba(255,255,255,.18)">
            <span className="text-[15px] font-black text-white">{done}/{required.length}</span>
          </ProgressRing>
        </div>
      </div>
      <div className="px-4 pb-4 pt-3">
        <Bar value={pct} color="#D4A853" className="bg-white/15" />
        <p className="mt-2.5 text-[12px] font-bold text-white/75">
          Completion reward <span className="text-[#E7C577]">+{hunt.completion_points.toLocaleString()} Aloha Points</span>
        </p>
      </div>
    </button>
  );
};

export const HuntDetail: React.FC<{ id: string }> = ({ id }) => {
  const { db, back, go, startHunt, coords, stopEligibility } = useAloha();
  const h = useHelpers();
  const hunt = db.hunts.find((x) => x.id === id);
  if (!hunt) return <div className="p-10 text-center">Hunt not found.</div>;

  const stops = db.huntStops.filter((hs) => hs.hunt_id === hunt.id).sort((a, b) => a.sequence - b.sequence);
  const prog = db.huntProgress.find((p) => p.hunt_id === hunt.id);
  const required = stops.filter((s) => s.required);
  const doneCount = required.filter((s) => prog?.completed_stop_ids.includes(s.stop_id)).length;
  const pct = (doneCount / Math.max(1, required.length)) * 100;
  const complete = prog?.status === 'completed';
  const routeIds = stops.map((s) => s.stop_id);
  const huntStopRecords = db.stops.filter((s) => routeIds.includes(s.id));
  const inRangeIds = new Set(huntStopRecords.filter((s) => stopEligibility(s).inRange).map((s) => s.id));
  const cooldownIds = new Set(huntStopRecords.filter((s) => stopEligibility(s).interactionCooling).map((s) => s.id));

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-32">
      <div className="relative h-[240px]">
        <img src={hunt.hero} alt={hunt.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#031A27]/60 via-[#031A27]/25 to-[#FBF7F0]" />
        <div className="absolute inset-x-0 top-0">
          <HeaderBar transparent onBack={back} right={<SaveButton type="hunt" id={hunt.id} floating className="h-10 w-10" />} />
        </div>
        <div className="absolute bottom-8 left-4 right-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {hunt.sponsored_by && <Pill tone="gold" icon="BadgeCheck">Sponsored by {hunt.sponsored_by}</Pill>}
            {complete && <Pill tone="green" icon="Check">Completed</Pill>}
            {hunt.status === 'upcoming' && <Pill tone="dark" icon="Clock">Opens {new Date(hunt.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Pill>}
          </div>
          <h1 className="text-[28px] font-black uppercase leading-[1.05] tracking-wide text-white drop-shadow">{hunt.name}</h1>
          <p className="mt-1 text-[13px] font-bold text-white/80">{hunt.subtitle}</p>
        </div>
      </div>

      <div className="px-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={pct} size={76} stroke={8} color={complete ? '#2F855A' : '#1FA9A3'}>
              <span className="text-[15px] font-black text-[#062B3F]">{doneCount}/{required.length}</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/50">Progress</p>
              <p className="text-[15px] font-extrabold text-[#062B3F]">
                {complete ? 'Hunt complete' : `${doneCount} of ${required.length} required stops`}
              </p>
              <Bar value={pct} className="mt-2" color={complete ? '#2F855A' : '#1FA9A3'} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-black/5 pt-3.5 text-center">
            {[
              ['Region', h.region(hunt.region_id)?.name ?? ''],
              ['Stops', String(stops.length)],
              ['Time', `${Math.round(hunt.est_minutes / 60)}h`],
              ['Reward', `+${hunt.completion_points.toLocaleString()}`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{k}</p>
                <p className="mt-0.5 truncate text-[13px] font-extrabold text-[#062B3F]">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        <p className="mt-4 text-[13.5px] leading-relaxed text-[#0B4F6C]/75">{hunt.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Pill tone="slate" icon="CalendarDays">
            {new Date(hunt.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(hunt.ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Pill>
          <Pill tone="aqua" icon={hunt.group_friendly ? 'Users' : 'User'}>{hunt.group_friendly ? 'Group friendly' : 'Solo friendly'}</Pill>
          {hunt.bonus_points > 0 && <Pill tone="gold" icon="Sparkles">+{hunt.bonus_points} bonus</Pill>}
        </div>

        {hunt.bonus_condition && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#D4A853]/12 p-3.5 ring-1 ring-[#D4A853]/25">
            <Icon name="Gift" className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6414]" />
            <div>
              <p className="text-[12.5px] font-extrabold text-[#062B3F]">Bonus: +{hunt.bonus_points} Aloha Points</p>
              <p className="text-[12px] text-[#0B4F6C]/65">{hunt.bonus_condition}</p>
            </div>
          </div>
        )}

        <div className="mt-5">
          <SectionTitle title="Route" sub="Stops can be completed in any order unless noted" />
          <Card className="relative h-52 overflow-hidden">
            <MapCanvas
              stops={huntStopRecords}
              drops={db.drops}
              huntStopIds={new Set(routeIds)}
              userCoords={coords}
              onSelect={(sid) => go({ name: 'stop', id: sid })}
              categoryIcon={(cid) => h.category(cid)?.icon ?? 'MapPin'}
              routeStopIds={routeIds}
              compact
              inRangeIds={inRangeIds}
              cooldownIds={cooldownIds}
            />
          </Card>
        </div>

        <div className="mt-5">
          <SectionTitle title="Stop sequence" sub={`${required.length} required · ${stops.length - required.length} bonus`} />
          <div className="space-y-2.5">
            {stops.map((hs, i) => {
              const stop = db.stops.find((s) => s.id === hs.stop_id);
              if (!stop) return null;
              const isDone = !!prog?.completed_stop_ids.includes(stop.id);
              return (
                <div key={hs.id}>
                  <StopRow
                    stop={stop}
                    index={i + 1}
                    done={isDone}
                    onClick={() => go({ name: 'stop', id: stop.id })}
                    right={
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${isDone ? 'bg-[#2F855A]/12 text-[#22633F]' : hs.required ? 'bg-[#0B4F6C]/8 text-[#0B4F6C]' : 'bg-[#D4A853]/16 text-[#8A6414]'}`}>
                        {isDone ? 'Complete' : hs.required ? 'To do' : 'Bonus'}
                      </span>
                    }
                  />
                  <p className="mt-1 pl-4 text-[11.5px] italic text-[#0B4F6C]/45">{hs.hint}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-4 ring-1 ring-black/5">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Completion requirements</p>
          <ul className="mt-2 space-y-1.5">
            {[
              `Verified check-in at all ${required.length} required Aloha Stops`,
              'Each check-in must pass server-side geofence or QR verification',
              `Hunt window: ${new Date(hunt.starts_at).toLocaleDateString()} – ${new Date(hunt.ends_at).toLocaleDateString()}`,
              'Completion points are awarded once per member',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[12.5px] text-[#0B4F6C]/70">
                <Icon name="Check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1FA9A3]" />{t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 mt-6 border-t border-black/5 bg-[#FBF7F0]/95 px-4 pb-4 pt-3 backdrop-blur-xl">

        {complete ? (
          <Btn full size="lg" variant="gold" icon="Trophy" onClick={() => go({ name: 'passport' })}>View your Passport</Btn>
        ) : prog ? (
          <Btn full size="lg" variant="coral" icon="Navigation"
            onClick={() => {
              const next = required.find((s) => !prog.completed_stop_ids.includes(s.stop_id));
              if (next) go({ name: 'stop', id: next.stop_id });
            }}>
            Go to next stop
          </Btn>
        ) : (
          <Btn full size="lg" variant="primary" icon="Play" disabled={hunt.status === 'upcoming'} onClick={() => startHunt(hunt.id)}>
            {hunt.status === 'upcoming' ? 'Opens soon' : 'Start Hunt'}
          </Btn>
        )}
      </div>
    </div>
  );
};
