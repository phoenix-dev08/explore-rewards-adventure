import React, { useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Bar, Btn, Card, Chip, HeaderBar, Icon, Pill, Points, ProgressRing, SectionTitle, StatTile } from '../kit';
import { Row, StopRow, useHelpers } from '../cards';
import { earnedPointsThisWeek, earnedPointsToday } from '@/lib/engine';
import { NotificationChannel } from '@/data/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const ProfileScreen: React.FC = () => {
  const { db, go, signOut, setRole } = useAloha();
  const nav = useNavigate();

  const defs = db.stampDefs.filter((s) => s.island_id === db.user.island_id);
  const owned = db.stamps.length;
  const pct = Math.round((owned / defs.length) * 100);
  const huntsDone = db.huntProgress.filter((p) => p.status === 'completed').length;
  const unread = db.notifications.filter((n) => !n.read).length;
  const available = db.rewards.filter((r) => r.status === 'approved' && db.user.points_balance >= r.point_cost
    && r.quantity_claimed < r.quantity_total).length;

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B4F6C] via-[#08405A] to-[#062B3F] px-4 pb-16 pt-5 text-white">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#1FA9A3]/25 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8FE3DC]">Profile</p>
          <div className="flex gap-2">
            <button onClick={() => go({ name: 'notifications' })} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/12 active:scale-90">
              <Icon name="Bell" className="h-[18px] w-[18px]" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6F59] text-[10px] font-black">{unread}</span>}
            </button>
            <button onClick={() => go({ name: 'settings' })} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 active:scale-90">
              <Icon name="Settings" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-4">
          <div className="relative">
            <img src={db.user.avatar} alt="" className="h-[74px] w-[74px] rounded-full object-cover ring-4 ring-white/20" />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-[#D4A853] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#3A2A05]">Lv 4</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[25px] font-black leading-tight">{db.user.name}</h1>
            <p className="text-[12.5px] font-bold text-[#8FE3DC]">{db.user.status_label} · Member since {db.user.member_since}</p>
            <p className="mt-1 text-[11.5px] text-white/50">{db.user.email}</p>
          </div>
          <ProgressRing value={pct} size={62} stroke={6} color="#D4A853" track="rgba(255,255,255,.18)">
            <span className="text-[13px] font-black">{pct}%</span>
          </ProgressRing>
        </div>
      </div>

      <div className="-mt-10 px-4">
        <Card className="p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['Points', <Points key="p" value={db.user.points_balance} />, 'Sparkles'],
              ['Hunts', huntsDone, 'Flag'],
              ['Passport', `${pct}%`, 'Stamp'],
              ['Stamps', owned, 'BadgeCheck'],
            ].map(([label, value, icon]) => (
              <div key={String(label)}>
                <Icon name={icon as string} className="mx-auto h-4 w-4 text-[#1FA9A3]" />
                <p className="mt-1 text-[17px] font-black leading-none text-[#062B3F]">{value as React.ReactNode}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{label as string}</p>
              </div>
            ))}
          </div>
          <div className="mt-3.5 border-t border-black/5 pt-3">
            <div className="mb-1.5 flex justify-between text-[11.5px] font-bold">
              <span className="text-[#0B4F6C]/60">Daily earning limit</span>
              <span className="text-[#062B3F]">{earnedPointsToday(db as never).toLocaleString()} / {db.pointRules[0].daily_cap.toLocaleString()}</span>
            </div>
            <Bar value={(earnedPointsToday(db as never) / db.pointRules[0].daily_cap) * 100} />
            <div className="mb-1.5 mt-3 flex justify-between text-[11.5px] font-bold">
              <span className="text-[#0B4F6C]/60">Weekly earning limit</span>
              <span className="text-[#062B3F]">{earnedPointsThisWeek(db as never).toLocaleString()} / {db.pointRules[0].weekly_cap.toLocaleString()}</span>
            </div>
            <Bar value={(earnedPointsThisWeek(db as never) / db.pointRules[0].weekly_cap) * 100} color="#D4A853" />
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <StatTile label="Rewards ready" value={available} icon="Gift" tone="#FF6F59" />
          <StatTile label="Saved places" value={db.favorites.filter((f) => f.entity_type === 'stop').length} icon="Heart" tone="#1FA9A3" />
          <StatTile label="Check-ins" value={db.checkIns.filter((c) => c.status === 'verified').length} icon="CircleCheckBig" tone="#D4A853" />
        </div>

        <Card className="mt-4 divide-y divide-black/5 overflow-hidden p-0">
          <Row icon="Ticket" label="My Rewards" sub={`${db.redemptions.filter((r) => r.status === 'unused').length} ready to use`} onClick={() => go({ name: 'myrewards' })} tone="#FF6F59" />
          <Row icon="Heart" label="Saved" sub="Stops, Hunts, rewards & adventures" onClick={() => go({ name: 'saved' })} />
          <Row icon="Flag" label="My Hunts" sub={`${db.huntProgress.length} started · ${huntsDone} completed`} onClick={() => go({ name: 'myhunts' })} />
          <Row icon="Trophy" label="Achievements" onClick={() => go({ name: 'achievements' })} tone="#D4A853" />
          <Row icon="History" label="Activity History" onClick={() => go({ name: 'activity' })} />
          <Row icon="Sparkles" label="Point History" sub="Immutable ledger" onClick={() => go({ name: 'points' })} tone="#D4A853" />
          <Row icon="Bell" label="Notifications" sub={unread ? `${unread} unread` : 'All caught up'} onClick={() => go({ name: 'notifications' })} />
          <Row icon="Settings" label="Settings & Privacy" onClick={() => go({ name: 'settings' })} tone="#0B4F6C" />
        </Card>

        <SectionTitle className="mt-6" title="Role & operator surfaces" sub={`Signed in as ${db.user.role.replace('_', ' ')} · same database, different permissions`} />
        <Card className="mb-3 p-3">
          <div className="flex gap-2">
            {(['consumer', 'business_user', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn('flex-1 rounded-xl px-2 py-2 text-[11.5px] font-bold transition',
                  db.user.role === r ? 'bg-[#0B4F6C] text-white' : 'bg-[#0B4F6C]/8 text-[#0B4F6C]/70')}
              >
                {r === 'business_user' ? 'Partner' : r === 'admin' ? 'Admin' : 'Consumer'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#0B4F6C]/50">
            Row-level security is enforced in the database — elevate your role to unlock partner or admin writes.
          </p>
        </Card>
        <div className="grid grid-cols-2 gap-2.5">

          <button onClick={() => nav('/partner')} className="rounded-3xl bg-white p-4 text-left ring-1 ring-black/5 transition hover:ring-[#1FA9A3]/40">
            <Icon name="Store" className="h-5 w-5 text-[#1FA9A3]" />
            <p className="mt-2 text-[13.5px] font-extrabold text-[#062B3F]">Partner Portal</p>
            <p className="text-[11px] text-[#0B4F6C]/55">Island Brew House</p>
          </button>
          <button onClick={() => nav('/admin')} className="rounded-3xl bg-white p-4 text-left ring-1 ring-black/5 transition hover:ring-[#D4A853]/50">
            <Icon name="ShieldCheck" className="h-5 w-5 text-[#D4A853]" />
            <p className="mt-2 text-[13.5px] font-extrabold text-[#062B3F]">Admin Dashboard</p>
            <p className="text-[11px] text-[#0B4F6C]/55">Role-protected</p>
          </button>
        </div>

        <Btn full variant="ghost" className="mt-5 text-[#B23D2A]" icon="LogOut" onClick={signOut}>Sign out</Btn>
      </div>
    </div>
  );
};

export const PointHistory: React.FC = () => {
  const { db, back } = useAloha();
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');
  const list = db.transactions.filter((t) => filter === 'all' || (filter === 'earned' ? t.points > 0 : t.points < 0));
  const ICONS: Record<string, string> = {
    checkin: 'CircleCheckBig', hunt_completion: 'Flag', passport_milestone: 'Stamp', drop: 'Zap',
    promotion: 'Tag', referral: 'UserPlus', redemption: 'Ticket', admin_adjustment: 'Settings',
  };
  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Point History" onBack={back} subtitle="Server-authoritative ledger" />
      <div className="px-4">
        <Card className="mb-4 p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Current balance</p>
          <p className="text-[34px] font-black leading-none text-[#062B3F]"><Points value={db.user.points_balance} /></p>
          <p className="text-[11.5px] font-bold text-[#0B4F6C]/50">Aloha Points · no cash value</p>
        </Card>
        <div className="mb-3 flex gap-2">
          {(['all', 'earned', 'spent'] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</Chip>
          ))}
        </div>
        <Card className="divide-y divide-black/5 overflow-hidden p-0">
          {list.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', t.points > 0 ? 'bg-[#1FA9A3]/12' : 'bg-[#FF6F59]/12')}>
                <Icon name={ICONS[t.type] ?? 'Sparkles'} className={cn('h-4 w-4', t.points > 0 ? 'text-[#0B6B67]' : 'text-[#B23D2A]')} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-[#062B3F]">{t.label}</p>
                <p className="text-[11px] text-[#0B4F6C]/50">
                  {new Date(t.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {' · '}{t.type.replace('_', ' ')}
                </p>
              </div>
              <div className="text-right">
                <p className={cn('text-[14.5px] font-black', t.points > 0 ? 'text-[#2F855A]' : 'text-[#B23D2A]')}>
                  {t.points > 0 ? '+' : ''}{t.points.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#0B4F6C]/40">bal {t.balance_after.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </Card>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-[#0B4F6C]/45">
          Every row is an immutable ledger entry with an idempotency key. Balances are derived server-side; the client can never set them.
        </p>
      </div>
    </div>
  );
};

export const ActivityHistory: React.FC = () => {
  const { db, back, go } = useAloha();
  const h = useHelpers();
  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Activity History" onBack={back} subtitle={`${db.checkIns.length} check-in attempts`} />
      <div className="space-y-2 px-4">
        {db.checkIns.map((c) => {
          const stop = db.stops.find((s) => s.id === c.stop_id);
          if (!stop) return null;
          return (
            <button key={c.id} onClick={() => go({ name: 'stop', id: stop.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5">
              <img src={stop.images[0]} alt="" className={cn('h-12 w-12 rounded-xl object-cover', c.status === 'rejected' && 'grayscale')} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-extrabold text-[#062B3F]">{stop.name}</p>
                <p className="text-[11.5px] font-semibold text-[#0B4F6C]/55">
                  {new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {' · '}{c.method.toUpperCase()}{c.distance_m >= 0 ? ` · ${c.distance_m}m` : ''}
                </p>
              </div>
              {c.status === 'verified'
                ? <Pill tone="green">+{c.points_awarded}</Pill>
                : <Pill tone="coral">{c.reject_reason?.replace('_', ' ') ?? 'rejected'}</Pill>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const SavedScreen: React.FC = () => {
  const { db, back, go } = useAloha();
  const [type, setType] = useState<'stop' | 'hunt' | 'reward' | 'adventure'>('stop');
  const items = db.favorites.filter((f) => f.entity_type === type);
  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Saved" onBack={back} subtitle={`${db.favorites.length} saved items`} />
      <div className="px-4">
        <div className="mb-3 flex gap-2">
          {(['stop', 'hunt', 'reward', 'adventure'] as const).map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>
              {t === 'stop' ? 'Stops' : t === 'hunt' ? 'Hunts' : t === 'reward' ? 'Rewards' : 'Adventures'}
            </Chip>
          ))}
        </div>
        <div className="space-y-2.5">
          {items.map((f) => {
            if (type === 'stop') {
              const s = db.stops.find((x) => x.id === f.entity_id);
              return s ? <StopRow key={f.id} stop={s} onClick={() => go({ name: 'stop', id: s.id })} /> : null;
            }
            if (type === 'hunt') {
              const hh = db.hunts.find((x) => x.id === f.entity_id);
              return hh ? (
                <button key={f.id} onClick={() => go({ name: 'hunt', id: hh.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5">
                  <img src={hh.hero} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{hh.name}</span>
                    <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/60">+{hh.completion_points.toLocaleString()} pts</span>
                  </span>
                  <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/30" />
                </button>
              ) : null;
            }
            if (type === 'reward') {
              const r = db.rewards.find((x) => x.id === f.entity_id);
              return r ? (
                <button key={f.id} onClick={() => go({ name: 'reward', id: r.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5">
                  <img src={r.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{r.name}</span>
                    <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/60">{r.point_cost.toLocaleString()} points</span>
                  </span>
                  <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/30" />
                </button>
              ) : null;
            }
            const a = db.adventures.find((x) => x.id === f.entity_id);
            return a ? (
              <Card key={f.id} className="p-3.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#FF6F59]">Saved adventure</p>
                <p className="text-[14px] font-extrabold text-[#062B3F]">{a.title}</p>
                <p className="mt-0.5 text-[11.5px] text-[#0B4F6C]/60">{a.stopIds.length} stops · +{a.bonus_points} pts</p>
                <Btn size="sm" variant="outline" className="mt-2.5" icon="Play" onClick={() => go({ name: 'stop', id: a.stopIds[0] })}>Resume</Btn>
              </Card>
            ) : null;
          })}
          {!items.length && (
            <Card className="p-8 text-center">
              <Icon name="Heart" className="mx-auto mb-3 h-8 w-8 text-[#0B4F6C]/25" />
              <p className="text-[14px] font-extrabold text-[#062B3F]">Nothing saved here yet</p>
              <p className="mt-1 text-[12.5px] text-[#0B4F6C]/60">Tap the heart icon anywhere to save it.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export const MyHunts: React.FC = () => {
  const { db, back, go } = useAloha();
  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="My Hunts" onBack={back} />
      <div className="space-y-2.5 px-4">
        {db.huntProgress.map((p) => {
          const hunt = db.hunts.find((x) => x.id === p.hunt_id);
          if (!hunt) return null;
          const req = db.huntStops.filter((x) => x.hunt_id === hunt.id && x.required);
          const done = req.filter((x) => p.completed_stop_ids.includes(x.stop_id)).length;
          return (
            <button key={p.id} onClick={() => go({ name: 'hunt', id: hunt.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/5">
              <ProgressRing value={(done / req.length) * 100} size={48} stroke={5} color={p.status === 'completed' ? '#2F855A' : '#1FA9A3'}>
                <span className="text-[10px] font-black text-[#062B3F]">{done}/{req.length}</span>
              </ProgressRing>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-extrabold text-[#062B3F]">{hunt.name}</span>
                <span className="block text-[11.5px] font-semibold text-[#0B4F6C]/55">
                  Started {new Date(p.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </span>
              {p.status === 'completed' ? <Pill tone="green">Complete</Pill> : <Pill tone="aqua">In progress</Pill>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Achievements: React.FC = () => {
  const { db, back } = useAloha();
  const owned = new Set(db.stamps.map((s) => s.stamp_id));
  const defs = db.stampDefs;
  const verified = db.checkIns.filter((c) => c.status === 'verified').length;
  const huntsDone = db.huntProgress.filter((p) => p.status === 'completed').length;
  const earnedIds = new Set<string>();
  if (verified >= 1) earnedIds.add('ach_first');
  if (defs.filter((d) => d.region_id === 'rg_waikiki' && owned.has(d.id)).length >= 4) earnedIds.add('ach_waikiki');
  if (defs.filter((d) => d.region_id === 'rg_north' && owned.has(d.id)).length >= 3) earnedIds.add('ach_north');
  if (verified >= 5) earnedIds.add('ach_streak');
  if (huntsDone >= 3) earnedIds.add('ach_hunter');
  if (owned.size >= 20) earnedIds.add('ach_island');

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Achievements" onBack={back} subtitle={`${earnedIds.size} of ${db.milestones.length + 2} earned`} />
      <div className="grid grid-cols-2 gap-3 px-4">
        {[
          { id: 'ach_first', name: 'First Aloha', detail: 'Complete your first verified visit', icon: 'Sparkles', bonus_points: 100 },
          { id: 'ach_waikiki', name: 'Waikīkī Explorer', detail: 'Collect 4 Waikīkī stamps', icon: 'Palmtree', bonus_points: 500 },
          { id: 'ach_north', name: 'North Shore Foodie', detail: 'Collect 3 North Shore stamps', icon: 'UtensilsCrossed', bonus_points: 500 },
          { id: 'ach_streak', name: '5-Stop Streak', detail: 'Five verified visits in a week', icon: 'Flame', bonus_points: 400 },
          { id: 'ach_hunter', name: 'Hunt Finisher', detail: 'Complete 3 Hunts', icon: 'Trophy', bonus_points: 750 },
          { id: 'ach_island', name: 'Island Adventurer', detail: 'Collect 20 Oʻahu stamps', icon: 'Compass', bonus_points: 2500 },
        ].map((a) => {
          const has = earnedIds.has(a.id);
          return (
            <div key={a.id} className={cn('rounded-3xl p-4 text-center ring-1', has ? 'bg-white ring-[#D4A853]/45' : 'bg-white/60 ring-black/5')}>
              <span className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-2xl', has ? 'bg-gradient-to-br from-[#E7C577] to-[#D4A853]' : 'bg-[#0B4F6C]/8')}>
                <Icon name={has ? a.icon : 'Lock'} className={cn('h-6 w-6', has ? 'text-[#3A2A05]' : 'text-[#0B4F6C]/35')} />
              </span>
              <p className="mt-2.5 text-[13.5px] font-extrabold text-[#062B3F]">{a.name}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-[#0B4F6C]/55">{a.detail}</p>
              <p className={cn('mt-2 text-[11px] font-black uppercase tracking-wide', has ? 'text-[#8A6414]' : 'text-[#0B4F6C]/35')}>
                {has ? 'Earned' : `+${a.bonus_points} pts`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Notifications: React.FC = () => {
  const { db, back, go, markNotificationsRead } = useAloha();
  React.useEffect(() => { const t = window.setTimeout(markNotificationsRead, 1200); return () => window.clearTimeout(t); }, [markNotificationsRead]);
  const ICONS: Record<NotificationChannel, string> = {
    drops: 'Zap', hunts: 'Flag', rewards: 'Gift', expirations: 'Clock', passport: 'Stamp', promotions: 'Tag', account: 'ShieldCheck',
  };
  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Notifications" onBack={back} right={
        <button onClick={() => go({ name: 'settings' })} className="text-[12px] font-bold text-[#1FA9A3]">Preferences</button>
      } />
      <div className="space-y-2 px-4">
        {db.notifications.map((n) => (
          <button key={n.id} onClick={() => {
            if (n.action?.screen === 'drops' && n.action.id) go({ name: 'drop', id: n.action.id });
            else if (n.action?.screen === 'hunt' && n.action.id) go({ name: 'hunt', id: n.action.id });
            else if (n.action?.screen === 'stop' && n.action.id) go({ name: 'stop', id: n.action.id });
            else if (n.action?.screen === 'rewards') go({ name: 'myrewards' });
            else if (n.action?.screen === 'passport') go({ name: 'passport' });
          }} className={cn('flex w-full items-start gap-3 rounded-2xl p-3.5 text-left ring-1 transition', n.read ? 'bg-white ring-black/5' : 'bg-[#1FA9A3]/8 ring-[#1FA9A3]/25')}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B4F6C]/8">
              <Icon name={ICONS[n.channel]} className="h-4 w-4 text-[#0B4F6C]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[13.5px] font-extrabold text-[#062B3F]">{n.title}</span>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF6F59]" />}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-[#0B4F6C]/65">{n.body}</span>
              <span className="mt-1 block text-[10.5px] font-bold uppercase tracking-wide text-[#0B4F6C]/35">
                {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 px-5 text-[11px] leading-relaxed text-[#0B4F6C]/45">
        In preview these render in-app. The same payload shape drives native push (APNs/FCM) in production.
      </p>
    </div>
  );
};

export const Settings: React.FC = () => {
  const { db, back, setPref, locStatus, requestLocation, denyLocation, demoLabel, toast } = useAloha();
  const CHANNELS: { id: NotificationChannel; label: string; sub: string; optional: boolean }[] = [
    { id: 'drops', label: 'Nearby Aloha Drops', sub: 'Limited drops close to you', optional: true },
    { id: 'hunts', label: 'New Hunts', sub: 'New adventures in your regions', optional: true },
    { id: 'rewards', label: 'Rewards', sub: 'New partner rewards you can afford', optional: true },
    { id: 'expirations', label: 'Expirations', sub: 'Reward and drop reminders', optional: true },
    { id: 'passport', label: 'Passport progress', sub: 'Stamp and milestone nudges', optional: true },
    { id: 'promotions', label: 'Promotions', sub: 'Partner offers and campaigns', optional: true },
    { id: 'account', label: 'Account & security', sub: 'Sign-ins and redemption receipts', optional: false },
  ];
  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Settings & Privacy" onBack={back} />
      <div className="px-4">
        <SectionTitle title="Location" sub="Requested in the moment — never a background trail" />
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl',
              locStatus === 'granted' ? 'bg-[#2F855A]/12' : locStatus === 'demo' ? 'bg-[#D4A853]/16' : 'bg-[#FF6F59]/12')}>
              <Icon name={locStatus === 'denied' ? 'LocateOff' : 'LocateFixed'} className={cn('h-5 w-5',
                locStatus === 'granted' ? 'text-[#2F855A]' : locStatus === 'demo' ? 'text-[#8A6414]' : 'text-[#B23D2A]')} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-extrabold text-[#062B3F]">
                {locStatus === 'granted' ? 'Device location active' : locStatus === 'demo' ? 'Demo location simulation' : locStatus === 'denied' ? 'Location is off' : 'Location not requested'}
              </p>
              <p className="text-[11.5px] text-[#0B4F6C]/60">{locStatus === 'demo' ? demoLabel : 'Used for nearby discovery and visit verification only'}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Btn size="sm" variant="secondary" className="flex-1" icon="LocateFixed" onClick={requestLocation}>Enable</Btn>
            <Btn size="sm" variant="outline" className="flex-1" onClick={denyLocation}>Turn off</Btn>
          </div>
          <ul className="mt-3 space-y-1.5 border-t border-black/5 pt-3">
            {[
              'We never store a continuous location history',
              'Coordinates are used once per verification then discarded',
              'You can browse all of Oʻahu with location off',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[11.5px] text-[#0B4F6C]/60">
                <Icon name="ShieldCheck" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1FA9A3]" />{t}
              </li>
            ))}
          </ul>
        </Card>

        <SectionTitle className="mt-6" title="Notifications" sub="Opt out of anything optional" />
        <Card className="divide-y divide-black/5 overflow-hidden p-0">
          {CHANNELS.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-[#062B3F]">{c.label}</p>
                <p className="text-[11.5px] text-[#0B4F6C]/55">{c.sub}{!c.optional && ' · required'}</p>
              </div>
              <button
                onClick={() => c.optional ? setPref(c.id, !db.prefs[c.id]) : toast({ title: 'Required for account security', tone: 'info' })}
                className={cn('relative h-7 w-12 shrink-0 rounded-full transition', db.prefs[c.id] ? 'bg-[#1FA9A3]' : 'bg-[#0B4F6C]/15', !c.optional && 'opacity-60')}
                aria-label={`Toggle ${c.label}`}
              >
                <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', db.prefs[c.id] ? 'left-6' : 'left-1')} />
              </button>
            </div>
          ))}
        </Card>

        <SectionTitle className="mt-6" title="Account" />
        <Card className="divide-y divide-black/5 overflow-hidden p-0">
          <Row icon="User" label="Personal information" sub={db.user.email} onClick={() => toast({ title: 'Demo account', body: 'Account editing is stubbed in this preview.', tone: 'info' })} />
          <Row icon="Lock" label="Password & sessions" sub="1 active session · iPhone 15" onClick={() => toast({ title: 'Session management', body: 'Sessions are managed server-side in production.', tone: 'info' })} />
          <Row icon="FileText" label="Terms of Service" onClick={() => toast({ title: 'Terms', body: 'Aloha Points are loyalty points with no cash value.', tone: 'info' })} />
          <Row icon="ShieldCheck" label="Privacy Policy" onClick={() => toast({ title: 'Privacy', body: 'We collect the minimum needed to verify visits and award points.', tone: 'info' })} />
          <Row icon="Trash2" label="Delete account" sub="Removes profile, ledger stays anonymised" tone="#FF6F59" onClick={() => toast({ title: 'Deletion requested', body: 'A confirmation email would be sent in production.', tone: 'info' })} />
        </Card>
        <p className="mt-4 text-center text-[11px] text-[#0B4F6C]/40">Aloha Hunt demo build · Oʻahu market · v0.9.0</p>
      </div>
    </div>
  );
};
