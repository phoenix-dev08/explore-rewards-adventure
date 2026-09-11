import React, { useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { AlohaMark, Btn, Icon, Wordmark } from './kit';
import { IMAGES } from '@/data/seed';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    key: 'intro',
    image: IMAGES.heroes[0],
    eyebrow: 'Oʻahu, Hawaiʻi',
    title: 'ALOHA HUNT',
    body: 'Explore. Hunt. Get rewarded.',
    long: 'Turn a day on the island into a real-world adventure with points, stamps and partner rewards.',
    cta: 'Start Exploring',
  },
  {
    key: 'discover',
    image: IMAGES.heroes[1],
    eyebrow: 'Step 01',
    title: 'Discover Oʻahu',
    body: 'Local food, activities, attractions, shops, experiences, wellness and entertainment — curated across all seven Oʻahu regions.',
    long: 'Every participating location is an Aloha Stop, with hours, distance and what you can earn there.',
    cta: 'Next',
  },
  {
    key: 'earn',
    image: IMAGES.heroes[2],
    eyebrow: 'Step 02',
    title: 'Earn While You Explore',
    body: 'Verified visits earn Aloha Points, Island Passport stamps and progress on multi-stop Hunts.',
    long: 'Redeem points for real partner rewards. Aloha Points are loyalty points — they have no cash value and can’t be transferred.',
    cta: 'Next',
  },
];

const Onboarding: React.FC = () => {
  const { completeOnboarding, requestLocation, denyLocation } = useAloha();
  const [i, setI] = useState(0);
  const [locStep, setLocStep] = useState(false);
  const [busy, setBusy] = useState(false);
  const slide = SLIDES[i];

  const allow = async () => {
    setBusy(true);
    await requestLocation();
    setBusy(false);
    completeOnboarding();
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#031A27]">
      {SLIDES.map((s, idx) => (
        <img
          key={s.key}
          src={s.image}
          alt=""
          className={cn('absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms]', idx === i && !locStep ? 'scale-100 opacity-100' : 'scale-110 opacity-0')}
        />
      ))}
      {locStep && <img src={IMAGES.heroes[0]} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-70" />}
      <div className="absolute inset-0 bg-gradient-to-b from-[#031A27]/70 via-[#031A27]/35 to-[#031A27]/96" />

      <div className="relative flex h-full flex-col px-7 pb-10 pt-12">
        <div className="flex items-center justify-between">
          <Wordmark light size="sm" />
          {!locStep && i < SLIDES.length - 1 && (
            <button onClick={() => setI(SLIDES.length - 1)} className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/60 hover:text-white">Skip</button>
          )}
        </div>

        {!locStep ? (
          <>
            <div className="flex flex-1 flex-col justify-end pb-8">
              {i === 0 && (
                <div className="mb-6 animate-[ah-rise_.8s_ease]">
                  <AlohaMark size={78} />
                </div>
              )}
              <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[10.5px] font-black uppercase tracking-[0.2em] text-white/85 backdrop-blur">
                <Icon name="MapPin" className="h-3 w-3" /> {slide.eyebrow}
              </span>
              <h1 className={cn('font-black tracking-tight text-white', i === 0 ? 'text-[42px] leading-[1.02] tracking-[0.06em]' : 'text-[34px] leading-[1.08]')}>
                {slide.title}
              </h1>
              <p className={cn('mt-3 max-w-md font-bold text-white/90', i === 0 ? 'text-[17px] tracking-[0.12em] uppercase' : 'text-[16px] leading-relaxed')}>
                {slide.body}
              </p>
              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-white/60">{slide.long}</p>
            </div>

            <div className="mb-5 flex gap-1.5">
              {SLIDES.map((s, idx) => (
                <span key={s.key} className={cn('h-1.5 rounded-full transition-all duration-300', idx === i ? 'w-8 bg-[#1FA9A3]' : 'w-1.5 bg-white/30')} />
              ))}
            </div>
            <Btn
              full size="lg" variant="coral" icon={i === 0 ? 'Compass' : 'ArrowRight'}
              onClick={() => (i < SLIDES.length - 1 ? setI(i + 1) : setLocStep(true))}
            >
              {slide.cta}
            </Btn>
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-end pb-2">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1FA9A3]/25 ring-1 ring-white/20 backdrop-blur">
              <Icon name="LocateFixed" className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-[32px] font-black leading-[1.08] tracking-tight text-white">Your Location, Your Choice</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-white/75">
              Aloha Hunt is not a tracking app. We request your location only in the moment you use it — never continuously in the background.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                ['Navigation', 'Show nearby Aloha Stops on the Oʻahu map'],
                ['Flag', 'Find Hunts happening close to you'],
                ['Zap', 'Discover nearby limited Aloha Drops'],
                ['Sparkles', 'Personalise Surprise Me recommendations'],
                ['ShieldCheck', 'Verify a qualifying visit when you check in'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-3 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10 backdrop-blur">
                  <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-[#8FE3DC]" />
                  <span className="text-[13px] font-semibold text-white/85">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2.5">
              <Btn full size="lg" variant="coral" icon="LocateFixed" onClick={allow} disabled={busy}>
                {busy ? 'Requesting…' : 'Allow Location'}
              </Btn>
              <Btn full size="lg" variant="ghost" className="bg-white/10 text-white hover:bg-white/15" onClick={() => { denyLocation(); completeOnboarding(); }}>
                Browse Without Location
              </Btn>
            </div>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-white/45">
              You can change this any time in Settings › Privacy & Location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
