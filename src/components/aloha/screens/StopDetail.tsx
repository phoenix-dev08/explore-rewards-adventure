import React, { useEffect, useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Btn, Card, CooldownClock, Countdown, HeaderBar, Icon, Pill, SectionTitle } from '../kit';
import { SaveButton, useHelpers } from '../cards';
import { formatDistance } from '@/lib/geo';
import { hoursLabel, stopIsOpen } from '@/lib/recommend';
import CheckIn from './CheckIn';
import { cn } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const StopDetail: React.FC<{ id: string }> = ({ id }) => {
  const { db, back, go, distanceTo, toast, stopEligibility } = useAloha();
  const helpers = useHelpers();
  const [img, setImg] = useState(0);
  const [checkOpen, setCheckOpen] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const stop = db.stops.find((s) => s.id === id);
  if (!stop) return <div className="p-10 text-center text-[#0B4F6C]">Aloha Stop not found.</div>;

  const biz = helpers.business(stop.business_id);
  const cat = helpers.category(stop.category_id);
  const region = helpers.region(stop.region_id);
  const open = stopIsOpen(stop);
  const elig = stopEligibility(stop);
  const stamp = stop.passport_stamp_id ? db.stampDefs.find((s) => s.id === stop.passport_stamp_id) : null;
  const owned = stamp ? db.stamps.some((s) => s.stamp_id === stamp.id) : false;
  const stopRewards = db.rewards.filter((r) => r.stop_id === stop.id && r.status === 'approved');
  const stopPromos = db.promotions.filter((p) => p.stop_id === stop.id && p.status === 'approved');
  const drop = db.drops.find((d) => d.stop_id === stop.id && (d.status === 'live' || d.status === 'scheduled'));
  const relatedHunts = db.huntStops.filter((hs) => hs.stop_id === stop.id)
    .map((hs) => db.hunts.find((x) => x.id === hs.hunt_id))
    .filter((x) => x && x.status === 'active');

  return (
    <div className="relative min-h-full bg-[#FBF7F0] pb-32">
      {/* gallery */}
      <div className="relative h-[300px]">
        {stop.images.map((src, i) => (
          <img key={src} src={src} alt={stop.name} className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', i === img ? 'opacity-100' : 'opacity-0')} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#031A27]/55 via-transparent to-[#FBF7F0]" />
        <div className="absolute inset-x-0 top-0">
          <HeaderBar transparent onBack={back} right={
            <div className="flex gap-2">
              <SaveButton type="stop" id={stop.id} floating className="h-10 w-10" />
              <button onClick={() => toast({ title: 'Link copied', body: 'Share sheet is native on device.', tone: 'info' })}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow-lg backdrop-blur active:scale-90">
                <Icon name="Share2" className="h-[18px] w-[18px] text-[#062B3F]" />
              </button>
            </div>
          } />
        </div>
        <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-1.5">
          {stop.images.map((src, i) => (
            <button key={src} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}
              className={cn('h-1.5 rounded-full transition-all', i === img ? 'w-7 bg-white' : 'w-1.5 bg-white/50')} />
          ))}
        </div>
        {drop?.status === 'live' && (
          <div className="absolute bottom-14 left-4"><Pill tone="coral" icon="Zap">Aloha Drop live</Pill></div>
        )}
      </div>

      <div className="relative -mt-6 px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="slate" icon={cat?.icon}>{cat?.name}</Pill>
          <Pill tone="aqua" icon="MapPin">{region?.name}</Pill>
          {stop.featured && <Pill tone="gold" icon="Star">Featured partner</Pill>}
        </div>
        <h1 className="mt-2.5 text-[27px] font-black leading-tight tracking-tight text-[#062B3F]">{stop.name}</h1>
        <p className="mt-1 text-[14px] font-semibold text-[#0B4F6C]/70">{stop.tagline}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] font-bold">
          <span className="inline-flex items-center gap-1 text-[#062B3F]"><Icon name="Star" className="h-4 w-4 fill-[#D4A853] text-[#D4A853]" />{stop.rating}
            <span className="font-semibold text-[#0B4F6C]/50">({stop.review_count.toLocaleString()})</span></span>
          <span className={cn('inline-flex items-center gap-1.5', open ? 'text-[#2F855A]' : 'text-[#B23D2A]')}>
            <span className={cn('h-2 w-2 rounded-full', open ? 'bg-[#2F855A]' : 'bg-[#B23D2A]')} />{open ? 'Open now' : 'Closed'}
          </span>
          <button onClick={() => setShowHours((v) => !v)} className="inline-flex items-center gap-1 text-[#0B4F6C]/65">
            <Icon name="Clock" className="h-3.5 w-3.5" />{hoursLabel(stop)} <Icon name={showHours ? 'ChevronUp' : 'ChevronDown'} className="h-3.5 w-3.5" />
          </button>
          <span className="inline-flex items-center gap-1 text-[#0B4F6C]/65"><Icon name="Navigation" className="h-3.5 w-3.5" />{formatDistance(distanceTo(stop.coords))}</span>
          <span className="text-[#0B4F6C]/65">{'$'.repeat(stop.price_tier)}</span>
        </div>

        {showHours && (
          <Card className="mt-3 p-4">
            {stop.hours.map((hh) => (
              <div key={hh.day} className="flex justify-between py-1 text-[12.5px]">
                <span className={cn('font-bold', hh.day === new Date().getDay() ? 'text-[#062B3F]' : 'text-[#0B4F6C]/55')}>{DAYS[hh.day]}</span>
                <span className="font-semibold text-[#0B4F6C]/70">{hh.open} – {hh.close}</span>
              </div>
            ))}
          </Card>
        )}

        <p className="mt-4 text-[13.5px] leading-relaxed text-[#0B4F6C]/75">{stop.description}</p>

        {/* Earn here */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-3xl bg-gradient-to-br from-[#0B4F6C] to-[#062B3F] p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Earn here</p>
            <p className="mt-1 text-[26px] font-black leading-none">+{elig.points}</p>
            <p className="text-[11.5px] font-bold text-white/70">Aloha Points per verified visit</p>
            <p className="mt-2 text-[10.5px] text-white/45">
              {elig.rule.label} · points every {elig.rule.cooldown_hours}h · interact every {elig.interactionMinutes}m
            </p>
          </div>
          <div className={cn('rounded-3xl p-4', owned ? 'bg-[#2F855A]/12 ring-1 ring-[#2F855A]/25' : 'bg-[#D4A853]/14 ring-1 ring-[#D4A853]/30')}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A6414]">Passport</p>
            {stamp ? (
              <>
                <div className="mt-1.5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-[#8A6414]/50 bg-white/70">
                  <Icon name={stamp.icon} className="h-5 w-5 text-[#8A6414]" />
                </div>
                <p className="mt-2 text-[12.5px] font-extrabold text-[#062B3F]">{region?.name} Passport Stamp {owned ? 'collected' : 'available'}</p>
              </>
            ) : <p className="mt-2 text-[12.5px] font-bold text-[#0B4F6C]/60">No stamp at this Stop yet</p>}
          </div>
        </div>

        {/* Aloha Drop */}
        {drop && (
          <div className="mt-4">
            <SectionTitle title="Aloha Drop" />
            <button onClick={() => go({ name: 'drop', id: drop.id })} className="w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] p-4 text-left text-white shadow-[0_18px_40px_-22px_rgba(255,111,89,.9)]">
              <div className="flex items-center gap-2">
                <Icon name="Zap" className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em]">{drop.status === 'live' ? 'Live now' : 'Scheduled'}</span>
                {drop.status === 'live' && <Countdown to={drop.ends_at} className="ml-auto text-[12px] font-bold" prefix="Ends " />}
              </div>
              <p className="mt-1.5 text-[16px] font-black">{drop.title}</p>
              <p className="text-[12px] font-semibold text-white/80">
                +{drop.points} pts · {drop.quantity_total - drop.quantity_claimed} / {drop.quantity_total} remaining
              </p>
            </button>
          </div>
        )}

        {/* Active hunts */}
        {relatedHunts.length > 0 && (
          <div className="mt-5">
            <SectionTitle title="Active Hunts" sub="This Stop counts toward these Hunts" />
            <div className="space-y-2">
              {relatedHunts.map((hunt) => {
                const prog = db.huntProgress.find((p) => p.hunt_id === hunt!.id);
                const req = db.huntStops.filter((x) => x.hunt_id === hunt!.id && x.required).length;
                return (
                  <button key={hunt!.id} onClick={() => go({ name: 'hunt', id: hunt!.id })}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5 transition active:scale-[.99]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1FA9A3]/12"><Icon name="Flag" className="h-4 w-4 text-[#1FA9A3]" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{hunt!.name}</span>
                      <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/60">
                        {prog?.completed_stop_ids.length ?? 0} of {req} stops · +{hunt!.completion_points.toLocaleString()} pts
                      </span>
                    </span>
                    <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/30" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rewards */}
        {stopRewards.length > 0 && (
          <div className="mt-5">
            <SectionTitle title="Rewards" action="All rewards" onAction={() => go({ name: 'rewards' })} />
            <div className="space-y-2">
              {stopRewards.map((r) => (
                <button key={r.id} onClick={() => go({ name: 'reward', id: r.id })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5 transition active:scale-[.99]">
                  <img src={r.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{r.name}</span>
                    <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/60">{r.point_cost.toLocaleString()} points</span>
                  </span>
                  <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/30" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Promotions */}
        {stopPromos.length > 0 && (
          <div className="mt-5">
            <SectionTitle title="Promotions" />
            <div className="space-y-2">
              {stopPromos.map((p) => (
                <div key={p.id} className="flex items-start gap-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-black/5">
                  <Icon name="Tag" className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6F59]" />
                  <div>
                    <p className="text-[13.5px] font-extrabold text-[#062B3F]">{p.title}</p>
                    <p className="text-[12px] text-[#0B4F6C]/65">{p.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* contact */}
        <div className="mt-5">
          <SectionTitle title="Details" />
          <Card className="divide-y divide-black/5">
            {[
              { icon: 'MapPin', label: stop.address, action: () => window.open(`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`, '_blank') },
              { icon: 'Phone', label: biz?.phone ?? '', action: () => window.open(`tel:${biz?.phone}`) },
              { icon: 'Globe', label: biz?.website ?? '', action: () => toast({ title: 'Demo partner', body: 'Fictional partner website for the demo.', tone: 'info' }) },
              { icon: 'Instagram', label: biz?.instagram ?? '', action: () => toast({ title: 'Demo partner', body: 'Fictional partner social account.', tone: 'info' }) },
            ].map((row) => (
              <button key={row.icon} onClick={row.action} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <Icon name={row.icon} className="h-4 w-4 shrink-0 text-[#1FA9A3]" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#062B3F]">{row.label}</span>
                <Icon name="ArrowUpRight" className="h-4 w-4 text-[#0B4F6C]/30" />
              </button>
            ))}
          </Card>
          <p className="mt-3 text-[11px] leading-relaxed text-[#0B4F6C]/40">
            Demo content: {biz?.legal_name}. Participating businesses shown in this preview are fictional examples.
          </p>
        </div>
      </div>

      {/* sticky actions */}
      <div className="sticky bottom-0 z-30 mt-6 border-t border-black/5 bg-[#FBF7F0]/95 px-4 pb-4 pt-3 backdrop-blur-xl">
        {elig.interactionCooling && elig.interactionReadyAt && (
          <p className="mb-2 text-center text-[13px] font-extrabold text-[#0B4F6C]/70">
            🕐 Cooldown — <CooldownClock until={elig.interactionReadyAt} prefix="" />
          </p>
        )}
        {elig.inRange && !elig.interactionCooling && (
          <p className="mb-2 text-center text-[13px] font-black text-[#1FA9A3]">🌺 Aloha Stop in range! Tap to collect</p>
        )}
        {!elig.inRange && !elig.interactionCooling && (
          <p className="mb-2 text-center text-[12px] font-bold text-[#0B4F6C]/55">
            Walk within {stop.geofence_m} m to activate · {formatDistance(distanceTo(stop.coords))}
          </p>
        )}
        <div className="flex gap-2">
          <Btn className="flex-1" size="lg" variant={elig.inRange && elig.canInteract ? 'coral' : 'primary'}
            icon={elig.interactionCooling ? 'Clock' : elig.inRange ? 'Sparkles' : 'MapPin'}
            onClick={() => setCheckOpen(true)}>
            {elig.interactionCooling ? 'Cooldown' : elig.inRange ? 'Collect this Stop' : 'Get closer'}
          </Btn>
          <Btn size="lg" variant="outline" icon="Navigation" onClick={() => window.open(`https://maps.google.com/?q=${stop.coords.lat},${stop.coords.lng}`, '_blank')}>Directions</Btn>
          <SaveButton type="stop" id={stop.id} className="h-[52px] w-[52px] rounded-2xl" />
        </div>
      </div>

      <CheckIn stop={stop} open={checkOpen} onClose={() => setCheckOpen(false)} />
    </div>
  );
};

export default StopDetail;
