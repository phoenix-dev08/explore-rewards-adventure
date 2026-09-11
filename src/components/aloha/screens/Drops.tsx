import React from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Bar, Btn, Card, Countdown, HeaderBar, Icon, Pill, SectionTitle } from '../kit';
import { DropCard, PointsBadge, useHelpers } from '../cards';
import { formatDistance } from '@/lib/geo';
import { dropStatus } from '@/lib/engine';

export const DropsScreen: React.FC = () => {
  const { db, go } = useAloha();
  const live = db.drops.filter((d) => d.status === 'live');
  const upcoming = db.drops.filter((d) => d.status === 'scheduled');
  const ended = db.drops.filter((d) => d.status === 'ended');

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Aloha Drops" onBack={() => go({ name: 'explore' })} subtitle="Limited-time, limited-quantity rewards" right={<PointsBadge />} />
      <div className="space-y-5 px-4">
        <div className="rounded-3xl bg-[#062B3F] p-4 text-white">
          <div className="flex items-center gap-2">
            <Icon name="Zap" className="h-4 w-4 text-[#FF9E4A]" />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">How Drops work</p>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">
            Drops are partner-funded bursts of bonus points and limited rewards. Qualify with a verified visit inside the
            Drop window — quantities are decremented server-side, one claim per member.
          </p>
        </div>

        {live.length > 0 && (
          <div>
            <SectionTitle title="Live now" sub={`${live.length} active on Oʻahu`} />
            <div className="space-y-3">{live.map((d) => <DropCard key={d.id} drop={d} onClick={() => go({ name: 'drop', id: d.id })} />)}</div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div>
            <SectionTitle title="Coming up" />
            <div className="space-y-3">{upcoming.map((d) => <DropCard key={d.id} drop={d} onClick={() => go({ name: 'drop', id: d.id })} />)}</div>
          </div>
        )}
        {ended.length > 0 && (
          <div>
            <SectionTitle title="Recently ended" />
            <div className="space-y-2">
              {ended.map((d) => (
                <Card key={d.id} className="flex items-center gap-3 p-3.5 opacity-70">
                  <Icon name="Clock" className="h-4 w-4 text-[#0B4F6C]/40" />
                  <span className="flex-1 text-[13px] font-bold text-[#062B3F]">{d.title}</span>
                  <Pill tone="slate">Ended</Pill>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DropDetail: React.FC<{ id: string }> = ({ id }) => {
  const { db, back, go, distanceTo, toast } = useAloha();
  const h = useHelpers();
  const drop = db.drops.find((d) => d.id === id);
  if (!drop) return <div className="p-10 text-center">Drop not found.</div>;
  const stop = db.stops.find((s) => s.id === drop.stop_id)!;
  const st = dropStatus(db as never, drop);
  const pct = (drop.quantity_claimed / drop.quantity_total) * 100;

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-32">
      <div className="relative h-[250px]">
        <img src={stop.images[0]} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF6F59]/50 via-[#031A27]/55 to-[#FBF7F0]" />
        <div className="absolute inset-x-0 top-0"><HeaderBar transparent onBack={back} /></div>
        <div className="absolute bottom-8 left-4 right-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#B23D2A]">
            <Icon name="Zap" className="h-3 w-3" /> Aloha Drop {drop.status === 'live' ? '· Today only' : '· Scheduled'}
          </span>
          <h1 className="mt-2 text-[27px] font-black leading-tight text-white drop-shadow">{drop.title}</h1>
          <p className="text-[13px] font-bold text-white/85">{stop.name} · {formatDistance(distanceTo(stop.coords))}</p>
        </div>
      </div>

      <div className="-mt-4 px-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{drop.status === 'live' ? 'Ends in' : 'Starts'}</p>
              <p className="text-[22px] font-black text-[#062B3F]">
                {drop.status === 'live'
                  ? <Countdown to={drop.ends_at} />
                  : new Date(drop.starts_at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Bonus</p>
              <p className="text-[22px] font-black text-[#FF6F59]">+{drop.points}</p>
            </div>
          </div>
          <div className="mt-3.5">
            <div className="mb-1.5 flex justify-between text-[12px] font-bold">
              <span className="text-[#0B4F6C]/65">{st.remaining} / {drop.quantity_total} rewards remaining</span>
              <span className="text-[#0B4F6C]/45">{Math.round(pct)}% claimed</span>
            </div>
            <Bar value={pct} color="#FF6F59" />
          </div>
        </Card>

        <p className="mt-4 text-[13.5px] leading-relaxed text-[#0B4F6C]/75">{drop.blurb}</p>

        <div className="mt-4 space-y-2">
          {[
            ['Gift', 'Reward', drop.reward_label ?? `+${drop.points} Aloha Points`],
            ['BadgeCheck', 'Sponsor', drop.sponsor],
            ['ShieldCheck', 'Eligibility', drop.eligibility],
            ['User', 'Per-member limit', `${drop.per_user_limit} claim`],
          ].map(([icon, k, v]) => (
            <div key={k} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-black/5">
              <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-[#1FA9A3]" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{k}</p>
                <p className="text-[13px] font-bold text-[#062B3F]">{v}</p>
              </div>
            </div>
          ))}
        </div>

        {st.claimedByUser && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-[#2F855A]/10 p-3.5 ring-1 ring-[#2F855A]/25">
            <Icon name="CircleCheckBig" className="h-5 w-5 text-[#2F855A]" />
            <p className="text-[13px] font-extrabold text-[#062B3F]">You’ve already claimed this Drop</p>
          </div>
        )}
        {st.soldOut && !st.claimedByUser && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-[#FF6F59]/10 p-3.5 ring-1 ring-[#FF6F59]/25">
            <Icon name="XCircle" className="h-5 w-5 text-[#B23D2A]" />
            <p className="text-[13px] font-extrabold text-[#062B3F]">All rewards claimed — watch for the next Drop</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-30 mt-6 border-t border-black/5 bg-[#FBF7F0]/95 px-4 pb-4 pt-3 backdrop-blur-xl">

        <div className="flex gap-2">
          <Btn className="flex-1" size="lg" variant="coral" icon="CircleCheckBig"
            disabled={st.claimedByUser || st.soldOut || drop.status !== 'live'}
            onClick={() => go({ name: 'stop', id: stop.id })}>
            {st.claimedByUser ? 'Already claimed' : drop.status !== 'live' ? 'Not live yet' : 'Check in to qualify'}
          </Btn>
          <Btn size="lg" variant="outline" icon="Navigation"
            onClick={() => window.open(`https://maps.google.com/?q=${stop.coords.lat},${stop.coords.lng}`, '_blank')}>
            Directions
          </Btn>
        </div>
      </div>
    </div>
  );
};
