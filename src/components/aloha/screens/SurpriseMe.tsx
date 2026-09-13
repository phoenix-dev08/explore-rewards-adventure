import React, { useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Btn, Card, HeaderBar, Icon, Pill, SectionTitle } from '../kit';
import MapCanvas from '../MapCanvas';
import { useHelpers } from '../cards';
import { budgetLabel, buildAdventure, fitsBudget, formatMinutes, hoursLabel, huntFitsBudget, spendLabel, typicalSpend } from '@/lib/recommend';
import { Adventure, AdventurePrefs } from '@/data/types';
import { MOOD_LABELS } from '@/data/seed';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    key: 'company', title: 'Who are you exploring with?', icon: 'Users',
    options: [
      { v: 'solo', label: 'Just me', icon: 'User' },
      { v: 'partner', label: 'Partner', icon: 'Heart' },
      { v: 'friends', label: 'Friends', icon: 'Users' },
      { v: 'family', label: 'Family', icon: 'Baby' },
    ],
  },
  {
    key: 'budget', title: "What's your budget?", icon: 'Wallet',
    options: [
      { v: 0, label: 'Free', icon: 'Gift' },
      { v: 25, label: 'Under $25', icon: 'Coins' },
      { v: 50, label: 'Under $50', icon: 'Banknote' },
      { v: 100, label: 'Under $100', icon: 'CreditCard' },
      { v: 999, label: 'Treat ourselves', icon: 'Crown' },
    ],
  },
  {
    key: 'minutes', title: 'How much time do you have?', icon: 'Clock',
    options: [
      { v: 60, label: 'Around 1 hour', icon: 'Timer' },
      { v: 180, label: 'Around 3 hours', icon: 'Clock' },
      { v: 300, label: 'Half day', icon: 'Sun' },
      { v: 540, label: 'All day', icon: 'Sunrise' },
    ],
  },
] as const;

const MOODS: { v: string; icon: string }[] = [
  { v: 'food', icon: 'UtensilsCrossed' }, { v: 'adventure', icon: 'Waves' }, { v: 'beach', icon: 'Palmtree' },
  { v: 'relaxing', icon: 'Flower2' }, { v: 'shopping', icon: 'ShoppingBag' }, { v: 'culture', icon: 'Landmark' },
  { v: 'entertainment', icon: 'Music' }, { v: 'romantic', icon: 'Heart' }, { v: 'local', icon: 'MapPin' },
  { v: 'surprise', icon: 'Sparkles' },
];

const SurpriseMe: React.FC = () => {
  const { db, back, go, coords, saveAdventure } = useAloha();
  const h = useHelpers();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<AdventurePrefs>({ company: 'friends', budget: 50, minutes: 180, moods: [] });
  const [building, setBuilding] = useState(false);
  const [salt, setSalt] = useState(1);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});

  const generate = (nextSalt = salt) => {
    setBuilding(true);
    window.setTimeout(() => {
      const a = buildAdventure(db.stops, db.regions, prefs, coords, nextSalt);
      setAdventure(a);
      setBuilding(false);
    }, 1100);
  };

  const setVal = (key: string, v: unknown) => {
    setPrefs((p) => ({ ...p, [key]: v } as AdventurePrefs));
    setAnswered((a) => ({ ...a, [key]: true }));
    window.setTimeout(() => setStep((s) => Math.min(STEPS.length, s + 1)), 180);
  };

  if (adventure) {
    return <Result adventure={adventure} onShuffle={() => { const n = salt + 1; setSalt(n); setAdventure(null); generate(n); }}
      onBack={() => { setAdventure(null); setStep(0); }} />;
  }

  if (building) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#0B4F6C] to-[#031A27] px-8 text-center text-white">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#1FA9A3]/25" />
          <span className="absolute inset-3 animate-pulse rounded-full bg-[#1FA9A3]/25" />
          <Icon name="Sparkles" className="relative h-11 w-11 text-[#E7C577]" />
        </div>
        <h3 className="mt-6 text-[20px] font-black">Building your Aloha Hunt…</h3>
        <p className="mt-2 max-w-xs text-[12.5px] leading-relaxed text-white/60">
          Matching nearby Aloha Stops, Hunts, Passport stamps, Aloha Drops, hours, budget and time.
        </p>
        <div className="mt-6 w-full max-w-xs space-y-2">
          {['Reading location + nearby Stops', 'Checking Hunts, Passport & Drops', 'Filtering hours, budget & time', 'Sequencing a mini itinerary'].map((t, i) => (
            <div key={t} className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-left text-[12px] font-semibold"
              style={{ animation: `ah-rise .5s ease ${i * 0.18}s both` }}>
              <Icon name="Check" className="h-3.5 w-3.5 text-[#8FE3DC]" />{t}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-32">
      <HeaderBar title="Surprise Me" onBack={back} subtitle="Personalised Oʻahu adventure builder" />
      <div className="px-4">
        <div className="rounded-3xl bg-gradient-to-br from-[#1FA9A3] to-[#0B4F6C] p-5 text-white">
          <Icon name="Sparkles" className="h-6 w-6 text-[#E7C577]" />
          <h2 className="mt-2.5 text-[22px] font-black leading-tight">What kind of Aloha adventure should we create?</h2>
          <p className="mt-1.5 text-[12.5px] text-white/70">Four quick questions. Budget is a hard filter — Free means only $0 Stops.</p>
        </div>

        <div className="mt-5 space-y-5">
          {STEPS.map((s, i) => (
            <div key={s.key} className={cn('transition-opacity', i <= step ? 'opacity-100' : 'pointer-events-none opacity-35')}>
              <SectionTitle title={s.title} sub={answered[s.key] ? 'Answered' : undefined} />
              <div className="flex flex-wrap gap-2">
                {s.options.map((o) => (
                  <button key={String(o.v)} onClick={() => setVal(s.key, o.v)}
                    className={cn('inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[13px] font-bold transition active:scale-95',
                      (prefs as unknown as Record<string, unknown>)[s.key] === o.v && answered[s.key]
                        ? 'border-[#0B4F6C] bg-[#0B4F6C] text-white'
                        : 'border-black/8 bg-white text-[#062B3F] hover:border-[#1FA9A3]/50')}>
                    <Icon name={o.icon} className="h-4 w-4" />{o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className={cn('transition-opacity', step >= STEPS.length ? 'opacity-100' : 'pointer-events-none opacity-35')}>
            <SectionTitle title="What's the mood?" sub="Pick as many as you like" />
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const on = prefs.moods.includes(m.v);
                return (
                  <button key={m.v}
                    onClick={() => setPrefs((p) => ({ ...p, moods: on ? p.moods.filter((x) => x !== m.v) : [...p.moods, m.v] }))}
                    className={cn('inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[13px] font-bold transition active:scale-95',
                      on ? 'border-[#FF6F59] bg-[#FF6F59] text-white' : 'border-black/8 bg-white text-[#062B3F]')}>
                    <Icon name={m.icon} className="h-4 w-4" />{MOOD_LABELS[m.v]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-black/5">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Your inputs</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone="aqua" icon="Users">{prefs.company}</Pill>
            <Pill tone="slate" icon="Wallet">{prefs.budget === 0 ? 'Free' : prefs.budget === 999 ? 'Treat ourselves' : `Under $${prefs.budget}`}</Pill>
            <Pill tone="slate" icon="Clock">{formatMinutes(prefs.minutes)}</Pill>
            {prefs.moods.map((m) => <Pill key={m} tone="coral">{MOOD_LABELS[m]}</Pill>)}
          </div>
          {!coords && <p className="mt-2.5 text-[11.5px] text-[#0B4F6C]/50">Location is off — we’ll rank by region popularity instead of distance.</p>}
        </div>
      </div>

      <div className="sticky bottom-0 z-30 mt-6 border-t border-black/5 bg-[#FBF7F0]/95 px-4 pb-4 pt-3 backdrop-blur-xl">

        <Btn full size="lg" variant="coral" icon="Sparkles" onClick={() => generate()}>Create my adventure</Btn>
      </div>
    </div>
  );
};

const Result: React.FC<{ adventure: Adventure; onShuffle: () => void; onBack: () => void }> = ({ adventure, onShuffle, onBack }) => {
  const { db, go, coords, saveAdventure, distanceTo } = useAloha();
  const h = useHelpers();
  const [showRoute, setShowRoute] = useState(true);
  const stops = adventure.stopIds
    .map((id) => db.stops.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s && fitsBudget(s, adventure.prefs));
  const extras = db.stops
    .filter((s) => s.status === 'approved' && fitsBudget(s, adventure.prefs) && !stops.some((p) => p.id === s.id))
    .sort((a, b) => (distanceTo(a.coords) ?? 1e9) - (distanceTo(b.coords) ?? 1e9));
  const budgetText = budgetLabel(adventure.prefs.budget);
  const budgetHunts = db.hunts.filter((hunt) => hunt.status === 'active' && huntFitsBudget(hunt.id, db.huntStops, db.stops, adventure.prefs));
  const budgetHuntIds = new Set(budgetHunts.map((hunt) => hunt.id));
  const stopInBudgetHunt = (stopId: string) => db.huntStops.some((hs) => hs.stop_id === stopId && budgetHuntIds.has(hs.hunt_id));
  const approxSpend = stops.reduce((n, s) => n + typicalSpend(s), 0);

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-32">
      <HeaderBar title="Your Aloha Hunt" onBack={onBack} right={
        <button onClick={onShuffle} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 active:scale-90">
          <Icon name="Shuffle" className="h-[18px] w-[18px] text-[#0B4F6C]" />
        </button>
      } />
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#062B3F] p-5 text-white shadow-[0_24px_50px_-26px_rgba(6,43,63,.9)]">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FF9E4A]/25 blur-2xl" />
          <p className="relative text-[10px] font-black uppercase tracking-[0.22em] text-[#8FE3DC]">Your Aloha Hunt</p>
          <h1 className="relative mt-1 text-[26px] font-black leading-tight">“{adventure.title}”</h1>
          <p className="relative mt-2 text-[12.5px] leading-relaxed text-white/70">{adventure.summary}</p>
          <div className="relative mt-3 inline-flex rounded-full bg-[#E7C577] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#3A2A05]">
            Budget · {budgetText}
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {[
              ['Stops', String(stops.length)],
              ['Time', formatMinutes(stops.reduce((m, s) => m + s.avg_minutes + 20, 0) || adventure.minutes)],
              ['Approx.', approxSpend === 0 ? 'Free' : `$${approxSpend}/person`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/10 p-2.5 text-center">
                <p className="text-[9.5px] font-black uppercase tracking-wide text-white/55">{k}</p>
                <p className="mt-0.5 text-[14px] font-black">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {stops.length > 0 && (
          <button onClick={() => setShowRoute((v) => !v)} className="mt-4 flex w-full items-center gap-2 text-[12.5px] font-bold text-[#1FA9A3]">
            <Icon name={showRoute ? 'ChevronUp' : 'Map'} className="h-4 w-4" />{showRoute ? 'Hide route map' : 'View Route'}
          </button>
        )}
        {showRoute && stops.length > 0 && (
          <Card className="relative mt-2 h-52 overflow-hidden">
            <MapCanvas
              stops={stops} drops={db.drops} huntStopIds={new Set(stops.map((s) => s.id))} userCoords={coords}
              onSelect={(id) => go({ name: 'stop', id })} categoryIcon={(cid) => h.category(cid)?.icon ?? 'MapPin'}
              routeStopIds={stops.map((s) => s.id)} compact
            />
          </Card>
        )}

        {!stops.length && (
          <div className="mt-5 rounded-3xl bg-white p-6 text-center ring-1 ring-black/5">
            <Icon name="Wallet" className="mx-auto h-7 w-7 text-[#0B4F6C]/30" />
            <p className="mt-2 text-[15px] font-extrabold text-[#062B3F]">Nothing fits this budget yet</p>
            <p className="mt-1 text-[12.5px] text-[#0B4F6C]/60">We will not add paid Stops to a Free plan, or anything over your cap. Raise the budget and try again.</p>
            <button onClick={onBack} className="mt-3 text-[13px] font-extrabold text-[#1FA9A3]">Change budget</button>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {stops.map((s, i) => (
            <button key={s.id} onClick={() => go({ name: 'stop', id: s.id })} className="relative flex w-full gap-3 rounded-3xl bg-white p-3 text-left ring-1 ring-black/5 transition active:scale-[.99]">
              {i < stops.length - 1 && <span className="absolute left-[38px] top-[76px] h-6 w-0.5 bg-gradient-to-b from-[#FF9E4A] to-transparent" />}
              <div className="relative">
                <img src={s.images[0]} alt="" className="h-[68px] w-[68px] rounded-2xl object-cover" />
                <span className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] text-[11px] font-black text-white ring-2 ring-white">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#FF6F59]">Stop {i + 1}</p>
                <p className="truncate text-[14.5px] font-extrabold text-[#062B3F]">{s.name}</p>
                <p className="truncate text-[12px] font-semibold text-[#0B4F6C]/60">{h.category(s.category_id)?.name} · {hoursLabel(s)}</p>
                <p className="mt-0.5 text-[11.5px] font-bold text-[#1FA9A3]">
                  +{h.pointsFor(s)} pts · ~{s.avg_minutes} min · <span className={typicalSpend(s) === 0 ? 'text-[#2F855A]' : ''}>{spendLabel(s)}</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.passport_stamp_id && <span className="rounded-full bg-[#D4A853]/16 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide text-[#8A6414]">Passport</span>}
                  {db.drops.some((d) => d.stop_id === s.id && d.status === 'live') && <span className="rounded-full bg-[#FF6F59]/16 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide text-[#B23D2A]">Drop</span>}
                  {stopInBudgetHunt(s.id) && <span className="rounded-full bg-[#1FA9A3]/14 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide text-[#0B6B67]">Hunt</span>}
                </div>
              </div>
              <Icon name="ChevronRight" className="h-5 w-5 shrink-0 self-center text-[#0B4F6C]/25" />
            </button>
          ))}
        </div>

        {extras.length > 0 && (
          <div className="mt-6">
            <SectionTitle title="More in your budget" sub={`${budgetText} · ${extras.length} other Aloha Stop${extras.length === 1 ? '' : 's'}`} />
            <div className="space-y-2">
              {extras.map((s) => (
                <button key={s.id} onClick={() => go({ name: 'stop', id: s.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5">
                  <img src={s.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{s.name}</span>
                    <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/60">
                      {h.category(s.category_id)?.name} · {spendLabel(s)}
                    </span>
                  </span>
                  <Icon name="ChevronRight" className="h-4 w-4 text-[#0B4F6C]/30" />
                </button>
              ))}
            </div>
          </div>
        )}

        {budgetHunts.length > 0 && (
          <div className="mt-6">
            <SectionTitle title="Hunts in your budget" sub={`${budgetText} · every Stop on these hunts fits`} />
            <div className="space-y-2">
              {budgetHunts.map((hunt) => (
                <button key={hunt.id} onClick={() => go({ name: 'hunt', id: hunt.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5">
                  <img src={hunt.hero} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{hunt.name}</span>
                    <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/60">{hunt.subtitle}</span>
                  </span>
                  <Icon name="ChevronRight" className="h-4 w-4 text-[#0B4F6C]/30" />
                </button>
              ))}
            </div>
          </div>
        )}

        {stops.length > 0 && (
          <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#E7C577] to-[#D4A853] p-4 text-[#3A2A05]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Complete all qualifying stops</p>
            <p className="mt-0.5 text-[24px] font-black">+{adventure.bonus_points.toLocaleString()} Aloha Points</p>
            <p className="text-[11.5px] font-bold opacity-75">Awarded server-side after the final verified check-in</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-30 mt-6 border-t border-black/5 bg-[#FBF7F0]/95 px-4 pb-4 pt-3 backdrop-blur-xl">

        <div className="flex gap-2">
          <Btn className="flex-1" size="lg" variant="coral" icon="Play" disabled={!stops[0]}
            onClick={() => { if (!stops[0]) return; saveAdventure(adventure); go({ name: 'stop', id: stops[0].id }); }}>
            Start This Adventure
          </Btn>
          <Btn size="lg" variant="outline" icon="Shuffle" onClick={onShuffle}>Shuffle</Btn>
          <Btn size="lg" variant="outline" icon="Heart" onClick={() => saveAdventure(adventure)} />
        </div>
      </div>
    </div>
  );
};

export default SurpriseMe;
