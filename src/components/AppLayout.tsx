import React from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Icon, Wordmark } from '@/components/aloha/kit';
import Onboarding from '@/components/aloha/Onboarding';
import AuthScreen from '@/components/aloha/AuthScreen';
import Explore from '@/components/aloha/screens/Explore';
import StopDetail from '@/components/aloha/screens/StopDetail';
import { HuntDetail, HuntsScreen } from '@/components/aloha/screens/Hunts';
import { PassportScreen, RegionDetail } from '@/components/aloha/screens/Passport';
import { MyRewards, RewardDetail, RewardsScreen } from '@/components/aloha/screens/Rewards';
import { DropDetail, DropsScreen } from '@/components/aloha/screens/Drops';
import SurpriseMe from '@/components/aloha/screens/SurpriseMe';
import {
  Achievements, ActivityHistory, MyHunts, Notifications, PointHistory, ProfileScreen, SavedScreen, Settings,
} from '@/components/aloha/screens/Profile';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// ALOHA HUNT — consumer application shell
// Explore. Hunt. Get rewarded.
// Mobile-first bottom navigation, with a desktop side rail on large screens.
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'explore', label: 'Explore', icon: 'Map' },
  { id: 'hunts', label: 'Hunts', icon: 'Flag' },
  { id: 'passport', label: 'Passport', icon: 'Stamp' },
  { id: 'rewards', label: 'Rewards', icon: 'Gift' },
  { id: 'profile', label: 'Profile', icon: 'User' },
] as const;

const ScreenSwitch: React.FC = () => {
  const { screen } = useAloha();
  switch (screen.name) {
    case 'explore': return <Explore />;
    case 'hunts': return <HuntsScreen />;
    case 'passport': return <PassportScreen />;
    case 'rewards': return <RewardsScreen />;
    case 'profile': return <ProfileScreen />;
    case 'stop': return <StopDetail id={screen.id} />;
    case 'hunt': return <HuntDetail id={screen.id} />;
    case 'region': return <RegionDetail id={screen.id} />;
    case 'reward': return <RewardDetail id={screen.id} />;
    case 'myrewards': return <MyRewards />;
    case 'drops': return <DropsScreen />;
    case 'drop': return <DropDetail id={screen.id} />;
    case 'surprise': return <SurpriseMe />;
    case 'saved': return <SavedScreen />;
    case 'myhunts': return <MyHunts />;
    case 'achievements': return <Achievements />;
    case 'activity': return <ActivityHistory />;
    case 'points': return <PointHistory />;
    case 'notifications': return <Notifications />;
    case 'settings': return <Settings />;
    default: return <Explore />;
  }
};

const Toasts: React.FC = () => {
  const { toasts } = useAloha();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn('pointer-events-auto w-full max-w-sm rounded-2xl px-4 py-3 shadow-[0_18px_40px_-18px_rgba(3,26,39,.6)] backdrop-blur-xl',
            t.tone === 'error' ? 'bg-[#B23D2A]/95 text-white' : 'bg-[#062B3F]/94 text-white')}
          style={{ animation: 'ah-rise .35s cubic-bezier(.22,1,.36,1)' }}
        >
          <div className="flex items-start gap-2.5">
            <Icon
              name={t.tone === 'success' ? 'CircleCheckBig' : t.tone === 'error' ? 'AlertCircle' : 'Info'}
              className="mt-0.5 h-4 w-4 shrink-0 text-[#8FE3DC]"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[11.5px] leading-snug text-white/70">{t.body}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const BottomNav: React.FC = () => {
  const { tab, go, db } = useAloha();
  const unread = db.notifications.filter((n) => !n.read).length;
  return (
    <nav className="z-40 shrink-0 border-t border-black/5 bg-[#FBF7F0]/97 px-2 pb-2 pt-1.5 backdrop-blur-xl lg:hidden">
      <div className="flex items-stretch">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => go({ name: t.id } as never)}
              className="relative flex flex-1 flex-col items-center gap-1 py-1.5 transition active:scale-90"
            >
              <span className={cn('relative flex h-8 w-12 items-center justify-center rounded-xl transition-all', active && 'bg-[#0B4F6C]')}>
                <Icon name={t.icon} className={cn('h-[19px] w-[19px]', active ? 'text-white' : 'text-[#0B4F6C]/45')} />
                {t.id === 'profile' && unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF6F59]" />}
              </span>
              <span className={cn('text-[10px] font-bold tracking-wide', active ? 'text-[#062B3F]' : 'text-[#0B4F6C]/45')}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const SideRail: React.FC = () => {
  const { tab, go, db } = useAloha();
  const nav = useNavigate();
  return (
    <aside className="hidden h-full min-h-0 w-[250px] shrink-0 flex-col overflow-y-auto border-r border-black/5 bg-white/85 px-4 py-6 lg:flex">
      <Wordmark size="md" />
      <div className="mt-8 space-y-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => go({ name: t.id } as never)}
            className={cn('flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[14px] font-bold transition',
              tab === t.id ? 'bg-[#0B4F6C] text-white shadow-[0_12px_26px_-16px_rgba(6,43,63,.9)]' : 'text-[#0B4F6C]/70 hover:bg-[#0B4F6C]/6')}
          >
            <Icon name={t.icon} className="h-[18px] w-[18px]" />{t.label}
          </button>
        ))}
        <div className="my-3 h-px bg-black/5" />
        <button onClick={() => go({ name: 'drops' })} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[14px] font-bold text-[#B23D2A] hover:bg-[#FF6F59]/8">
          <Icon name="Zap" className="h-[18px] w-[18px]" />Aloha Drops
          <span className="ml-auto rounded-full bg-[#FF6F59] px-1.5 py-0.5 text-[10px] font-black text-white">
            {db.drops.filter((d) => d.status === 'live').length}
          </span>
        </button>
        <button onClick={() => go({ name: 'surprise' })} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[14px] font-bold text-[#0B6B67] hover:bg-[#1FA9A3]/10">
          <Icon name="Sparkles" className="h-[18px] w-[18px]" />Surprise Me
        </button>
      </div>
      <div className="mt-auto space-y-1">
        <p className="px-3.5 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#0B4F6C]/35">Operator</p>
        <button onClick={() => nav('/partner')} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[13px] font-bold text-[#0B4F6C]/70 hover:bg-[#0B4F6C]/6">
          <Icon name="Store" className="h-4 w-4" />Partner Portal
        </button>
        <button onClick={() => nav('/admin')} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[13px] font-bold text-[#0B4F6C]/70 hover:bg-[#0B4F6C]/6">
          <Icon name="ShieldCheck" className="h-4 w-4" />Admin Dashboard
        </button>
      </div>
    </aside>
  );
};

const LoadingScreen: React.FC = () => (
  <div className="flex h-full min-h-full flex-col items-center justify-center bg-[#FBF7F0] px-8 text-center">
    <div className="relative flex h-24 w-24 items-center justify-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-[#1FA9A3]/20" />
      <Wordmark size="sm" />
    </div>
    <p className="mt-6 text-[14px] font-extrabold text-[#062B3F]">Loading Oʻahu…</p>
    <p className="mt-1 text-[12px] text-[#0B4F6C]/55">Fetching Aloha Stops, Hunts, rewards and your ledger.</p>
  </div>
);

const AppLayout: React.FC = () => {
  const { phase, db, loading, authChecked } = useAloha();

  return (
    <div className="flex h-full max-h-full overflow-hidden bg-gradient-to-br from-[#0B4F6C] via-[#083C54] to-[#031A27]">

      {phase === 'app' && <SideRail />}
      <div className="relative flex min-h-0 min-w-0 flex-1 items-stretch justify-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-60 lg:block"
          style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(31,169,163,.22), transparent 70%)' }}
        />
        <main
          className={cn(
            'relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[#FBF7F0]',
            phase === 'app'
              ? 'lg:max-w-[560px] lg:border-x lg:border-black/5 lg:shadow-[0_0_80px_-20px_rgba(3,26,39,.65)]'
              : 'lg:max-w-[480px] lg:shadow-[0_0_80px_-20px_rgba(3,26,39,.65)]',
          )}
        >
          <div id="aloha-scroll" className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
            {!authChecked && <LoadingScreen />}
            {authChecked && phase === 'onboarding' && <Onboarding />}
            {authChecked && phase === 'auth' && <AuthScreen />}
            {authChecked && phase === 'app' && (loading && !db.user.id ? <LoadingScreen /> : <ScreenSwitch />)}

          </div>
          {phase === 'app' && <BottomNav />}
          {/* overlay layer: bottom sheets and modals portal in here */}
          <div id="aloha-overlay" className="pointer-events-none absolute inset-0 z-50" />
          <Toasts />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
