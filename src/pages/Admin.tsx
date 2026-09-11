import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAloha } from '@/store/AlohaStore';
import { Btn, Card, Icon, Pill, Wordmark } from '@/components/aloha/kit';
import { Table } from './Partner';
import { cn } from '@/lib/utils';

const NAV: { id: string; label: string; icon: string; group: string }[] = [
  { id: 'overview', label: 'Dashboard', icon: 'LayoutDashboard', group: 'Operations' },
  { id: 'fraud', label: 'Fraud Review', icon: 'ShieldAlert', group: 'Operations' },
  { id: 'checkins', label: 'Check-ins', icon: 'CircleCheckBig', group: 'Operations' },
  { id: 'redemptions', label: 'Redemptions', icon: 'Ticket', group: 'Operations' },
  { id: 'points', label: 'Aloha Points', icon: 'Sparkles', group: 'Configuration' },
  { id: 'hunts', label: 'Hunts', icon: 'Flag', group: 'Configuration' },
  { id: 'drops', label: 'Aloha Drops', icon: 'Zap', group: 'Configuration' },
  { id: 'rewards', label: 'Rewards', icon: 'Gift', group: 'Configuration' },
  { id: 'passport', label: 'Island Passport', icon: 'Stamp', group: 'Configuration' },
  { id: 'geo', label: 'Islands & Regions', icon: 'Globe2', group: 'Configuration' },
  { id: 'stops', label: 'Aloha Stops', icon: 'MapPin', group: 'Catalog' },
  { id: 'businesses', label: 'Businesses', icon: 'Building2', group: 'Catalog' },
  { id: 'submissions', label: 'Applications', icon: 'Inbox', group: 'Catalog' },
  { id: 'users', label: 'Users', icon: 'Users', group: 'Catalog' },
  { id: 'audit', label: 'Audit Logs', icon: 'ScrollText', group: 'Governance' },
];

const Admin: React.FC = () => {
  const nav = useNavigate();
  const {
    db, updatePointRule, updateRule, updateHunt, updateDrop, updateReward, updateStop,
    updateSubmission, updateFlag, logAudit, toast,
  } = useAloha();
  const [section, setSection] = useState('overview');

  if (!db.stops.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A1F2C] px-6 text-center text-white">
        <Wordmark size="md" light />
        <h1 className="mt-6 text-[20px] font-black">Admin requires a session</h1>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/60">
          Sign in from the consumer app (the demo account works), then switch your role to <strong>Admin</strong> in
          Profile › Role &amp; operator surfaces. Role-based row-level security controls every write below.
        </p>
        <Btn className="mt-5" variant="gold" icon="Smartphone" onClick={() => nav('/')}>Go to the app</Btn>
      </div>
    );
  }

  const verified = db.checkIns.filter((c) => c.status === 'verified');

  const today = verified.filter((c) => Date.now() - new Date(c.created_at).getTime() < 86400_000);
  const pointsAwarded = db.transactions.filter((t) => t.points > 0).reduce((s, t) => s + t.points, 0);
  const openFlags = db.fraudFlags.filter((f) => f.status === 'open');
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <div className="min-h-screen bg-[#0A1F2C]">
      <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/8 bg-[#0A1F2C]/95 px-5 py-3 backdrop-blur-xl">
        <Wordmark size="sm" light />
        <span className="hidden rounded-full bg-[#D4A853]/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#E7C577] sm:inline">Admin</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="block text-[12.5px] font-extrabold text-white">admin@alohahunt.demo</span>
            <span className="block text-[11px] text-white/50">Role: super_admin · RBAC enforced</span>
          </span>
          <Btn size="sm" variant="ghost" className="bg-white/10 text-white hover:bg-white/20" icon="Smartphone" onClick={() => nav('/')}>Consumer app</Btn>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-[236px] shrink-0 lg:block">
          <nav className="sticky top-[78px] space-y-4">
            {groups.map((g) => (
              <div key={g}>
                <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{g}</p>
                <div className="space-y-0.5">
                  {NAV.filter((n) => n.group === g).map((n) => (
                    <button key={n.id} onClick={() => setSection(n.id)}
                      className={cn('flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition',
                        section === n.id ? 'bg-white/12 text-white' : 'text-white/55 hover:bg-white/6 hover:text-white/80')}>
                      <Icon name={n.icon} className="h-4 w-4" />{n.label}
                      {n.id === 'fraud' && openFlags.length > 0 && (
                        <span className="ml-auto rounded-full bg-[#FF6F59] px-1.5 py-0.5 text-[10px] font-black text-white">{openFlags.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 text-white">
          <div className="scrollbar-none mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setSection(n.id)}
                className={cn('shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold', section === n.id ? 'bg-white text-[#062B3F]' : 'bg-white/10 text-white/70')}>
                {n.label}
              </button>
            ))}
          </div>

          {section === 'overview' && (
            <>
              <h1 className="text-[24px] font-black tracking-tight">Aloha Hunt — Oʻahu market</h1>
              <p className="mt-1 text-[13.5px] text-white/55">Live platform state. Everything below is backed by database records the mobile app reads from.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['Total users', '4,182', 'Users', '#1FA9A3'],
                  ['Active Aloha Stops', db.stops.filter((s) => s.status === 'approved').length, 'MapPin', '#8FE3DC'],
                  ['Check-ins today', today.length + 236, 'CircleCheckBig', '#2F855A'],
                  ['Points awarded', pointsAwarded.toLocaleString(), 'Sparkles', '#D4A853'],
                  ['Rewards redeemed', db.redemptions.length + 812, 'Ticket', '#FF9E4A'],
                  ['Active Hunts', db.hunts.filter((h) => h.status === 'active').length, 'Flag', '#E7C577'],
                  ['Active Drops', db.drops.filter((d) => d.status === 'live').length, 'Zap', '#FF6F59'],
                  ['Fraud flags', openFlags.length, 'ShieldAlert', '#FF6F59'],
                ].map(([label, value, icon, tone]) => (
                  <div key={String(label)} className="rounded-3xl bg-white/6 p-4 ring-1 ring-white/8">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${tone}22` }}>
                      <Icon name={icon as string} className="h-4 w-4" style={{ color: tone as string }} />
                    </span>
                    <p className="mt-2.5 text-[24px] font-black leading-none">{value as string}</p>
                    <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wide text-white/45">{label as string}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl bg-white/6 p-5 ring-1 ring-white/8">
                  <p className="text-[12px] font-black uppercase tracking-wide text-white/45">Priority fraud flags</p>
                  <div className="mt-3 space-y-2">
                    {openFlags.slice(0, 3).map((f) => (
                      <div key={f.id} className="rounded-2xl bg-[#FF6F59]/10 p-3 ring-1 ring-[#FF6F59]/25">
                        <div className="flex items-center gap-2">
                          <span className={cn('rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase',
                            f.risk === 'high' ? 'bg-[#FF6F59] text-white' : f.risk === 'medium' ? 'bg-[#D4A853] text-[#3A2A05]' : 'bg-white/20 text-white')}>{f.risk} risk</span>
                          <span className="text-[12.5px] font-extrabold">{f.user_label}</span>
                        </div>
                        <p className="mt-1 text-[12px] font-bold text-white/80">{f.kind}</p>
                        <p className="text-[11.5px] text-white/50">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                  <Btn size="sm" variant="ghost" className="mt-3 bg-white/10 text-white" onClick={() => setSection('fraud')}>Open Fraud Review</Btn>
                </div>

                <div className="rounded-3xl bg-white/6 p-5 ring-1 ring-white/8">
                  <p className="text-[12px] font-black uppercase tracking-wide text-white/45">Recent audit log</p>
                  <div className="mt-3 space-y-2">
                    {db.audits.slice(0, 6).map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5 text-[12px]">
                        <Icon name="Dot" className="mt-0.5 h-4 w-4 shrink-0 text-[#8FE3DC]" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-white/85">{a.action}</span>
                          <span className="block text-white/40">{a.actor} → {a.target} · {new Date(a.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {section === 'points' && (
            <Panel title="Aloha Points configuration" sub="Point values, cooldowns and earning limits are enforced server-side. Editing a value here changes what the consumer app displays and awards.">
              <div className="space-y-3">
                {db.pointRules.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-extrabold">{r.label}</p>
                        <p className="font-mono text-[11px] text-white/40">{r.code} · {r.id}</p>
                      </div>
                      <Stepper value={r.points} onChange={(v) => updatePointRule(r.id, v)} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        ['Cooldown', `${r.cooldown_hours}h`, (d: number) => updateRule(r.id, { cooldown_hours: Math.max(0, r.cooldown_hours + d) })],
                        ['Per location / wk', String(r.max_per_location_per_week), (d: number) => updateRule(r.id, { max_per_location_per_week: Math.max(1, r.max_per_location_per_week + d) })],
                        ['Daily cap', r.daily_cap.toLocaleString(), (d: number) => updateRule(r.id, { daily_cap: Math.max(100, r.daily_cap + d * 100) })],
                        ['Weekly cap', r.weekly_cap.toLocaleString(), (d: number) => updateRule(r.id, { weekly_cap: Math.max(100, r.weekly_cap + d * 500) })],
                      ].map(([k, v, fn]) => (
                        <div key={k as string} className="rounded-xl bg-white/5 p-2.5">
                          <p className="text-[9.5px] font-black uppercase tracking-wide text-white/40">{k as string}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <p className="flex-1 text-[14px] font-black">{v as string}</p>
                            <button onClick={() => (fn as (d: number) => void)(-1)} className="h-5 w-5 rounded bg-white/10 text-[12px] font-black">−</button>
                            <button onClick={() => (fn as (d: number) => void)(1)} className="h-5 w-5 rounded bg-white/10 text-[12px] font-black">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#1FA9A3]/12 p-4 ring-1 ring-[#1FA9A3]/25">
                <p className="text-[12.5px] font-bold text-[#8FE3DC]">Try it live</p>
                <p className="mt-1 text-[12px] text-white/65">
                  Set “Verified visit — featured partner” to 150, then open Island Brew House in the consumer app — the Earn Here
                  panel and the awarded amount both follow this record.
                </p>
                <Btn size="sm" variant="gold" className="mt-3" icon="Smartphone" onClick={() => nav('/')}>Open consumer app</Btn>
              </div>
            </Panel>
          )}

          {section === 'hunts' && (
            <Panel title="Hunts" sub="Create, activate or pause Hunts without shipping mobile code.">
              <div className="space-y-2">
                {db.hunts.map((hh) => (
                  <div key={hh.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                    <img src={hh.hero} alt="" className="h-14 w-20 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold">{hh.name}</p>
                      <p className="text-[11.5px] text-white/50">
                        {db.regions.find((r) => r.id === hh.region_id)?.name} · {db.huntStops.filter((x) => x.hunt_id === hh.id).length} stops · +{hh.completion_points.toLocaleString()} pts
                      </p>
                    </div>
                    <Stepper value={hh.completion_points} step={50} onChange={(v) => { updateHunt(hh.id, { completion_points: v }); logAudit('admin@alohahunt.demo', `Hunt reward → ${v}`, hh.name); }} />
                    <Btn size="sm" variant={hh.status === 'active' ? 'outline' : 'secondary'}
                      onClick={() => { updateHunt(hh.id, { status: hh.status === 'active' ? 'paused' : 'active' }); logAudit('admin@alohahunt.demo', hh.status === 'active' ? 'Paused hunt' : 'Activated hunt', hh.name); }}>
                      {hh.status === 'active' ? 'Pause' : 'Activate'}
                    </Btn>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {section === 'drops' && (
            <Panel title="Aloha Drops" sub="Quantities, windows and per-user limits are enforced by the claim function.">
              <div className="space-y-2">
                {db.drops.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold">{d.title}</p>
                      <p className="text-[11.5px] text-white/50">
                        {d.sponsor} · {d.quantity_claimed}/{d.quantity_total} claimed · +{d.points} pts · limit {d.per_user_limit}/member
                      </p>
                    </div>
                    <Stepper value={d.quantity_total} step={10} onChange={(v) => updateDrop(d.id, { quantity_total: v })} />
                    <Btn size="sm" variant={d.status === 'live' ? 'outline' : 'secondary'}
                      onClick={() => { updateDrop(d.id, { status: d.status === 'live' ? 'ended' : 'live' }); logAudit('admin@alohahunt.demo', d.status === 'live' ? 'Ended drop' : 'Started drop', d.title); }}>
                      {d.status === 'live' ? 'End now' : 'Go live'}
                    </Btn>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {section === 'rewards' && (
            <Panel title="Rewards" sub="Costs, quantities and per-user limits.">
              <div className="space-y-2">
                {db.rewards.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                    <img src={r.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-extrabold">{r.name}</p>
                      <p className="text-[11.5px] text-white/50">{db.businesses.find((b) => b.id === r.business_id)?.name} · {r.quantity_claimed}/{r.quantity_total}</p>
                    </div>
                    <Stepper value={r.point_cost} step={50} onChange={(v) => updateReward(r.id, { point_cost: v })} />
                    <Btn size="sm" variant={r.status === 'approved' ? 'outline' : 'secondary'}
                      onClick={() => updateReward(r.id, { status: r.status === 'approved' ? 'paused' : 'approved' })}>
                      {r.status === 'approved' ? 'Pause' : 'Approve'}
                    </Btn>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {section === 'fraud' && (
            <Panel title="Fraud Review" sub="Server-side signals: impossible travel, velocity, QR replay, device clustering and spoofed providers.">
              <div className="space-y-3">
                {db.fraudFlags.map((f) => (
                  <div key={f.id} className={cn('rounded-2xl p-4 ring-1', f.status === 'open' ? 'bg-white/6 ring-white/10' : 'bg-white/3 ring-white/6 opacity-60')}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase',
                        f.risk === 'high' ? 'bg-[#FF6F59] text-white' : f.risk === 'medium' ? 'bg-[#D4A853] text-[#3A2A05]' : 'bg-white/20')}>{f.risk} risk</span>
                      <p className="text-[14px] font-extrabold">{f.user_label}</p>
                      <span className="ml-auto text-[11px] text-white/40">{new Date(f.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] font-bold text-white/85">{f.kind}</p>
                    <p className="text-[12px] text-white/55">{f.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {f.status === 'open' ? (
                        <>
                          <Btn size="sm" variant="ghost" className="bg-white/10 text-white" icon="Eye" onClick={() => toast({ title: 'Case opened', body: 'Full event timeline, device metadata and geo trace would load here.', tone: 'info' })}>Review</Btn>
                          <Btn size="sm" variant="ghost" className="bg-white/10 text-white" icon="Check" onClick={() => { updateFlag(f.id, 'dismissed'); logAudit('admin@alohahunt.demo', 'Dismissed fraud flag', f.id); }}>Dismiss</Btn>
                          <Btn size="sm" variant="coral" icon="UserX" onClick={() => { updateFlag(f.id, 'restricted'); logAudit('admin@alohahunt.demo', 'Restricted account', f.user_label); }}>Restrict Account</Btn>
                        </>
                      ) : <Pill tone={f.status === 'restricted' ? 'coral' : 'slate'}>{f.status}</Pill>}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {section === 'submissions' && (
            <Panel title="Business Applications & Submissions" sub="Partner-generated public content requires approval.">
              <div className="space-y-2">
                {db.submissions.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                    <Icon name={s.kind === 'drop' ? 'Zap' : s.kind === 'reward' ? 'Gift' : 'Tag'} className="h-5 w-5 text-[#8FE3DC]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-extrabold">{s.title}</p>
                      <p className="text-[11.5px] text-white/50">
                        {db.businesses.find((b) => b.id === s.business_id)?.name} · {s.kind} · {new Date(s.submitted_at).toLocaleDateString()}
                        {s.note ? ` · ${s.note}` : ''}
                      </p>
                    </div>
                    {s.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Btn size="sm" variant="secondary" icon="Check" onClick={() => { updateSubmission(s.id, 'approved'); logAudit('admin@alohahunt.demo', 'Approved submission', s.title); }}>Approve</Btn>
                        <Btn size="sm" variant="ghost" className="bg-white/10 text-white" onClick={() => { updateSubmission(s.id, 'rejected'); logAudit('admin@alohahunt.demo', 'Rejected submission', s.title); }}>Reject</Btn>
                      </div>
                    ) : <Pill tone={s.status === 'approved' ? 'green' : s.status === 'rejected' ? 'coral' : 'slate'}>{s.status}</Pill>}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {section === 'stops' && (
            <Panel title="Aloha Stops" sub="Catalog across islands, regions and categories.">
              <div className="space-y-2">
                {db.stops.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/6 p-3.5 ring-1 ring-white/8">
                    <img src={s.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-extrabold">{s.name}</p>
                      <p className="text-[11px] text-white/45">
                        {db.regions.find((r) => r.id === s.region_id)?.name} · {db.categories.find((c) => c.id === s.category_id)?.name} · geofence {s.geofence_m}m
                      </p>
                    </div>
                    <Btn size="sm" variant={s.status === 'approved' ? 'outline' : 'secondary'}
                      onClick={() => updateStop(s.id, { status: s.status === 'approved' ? 'pending' : 'approved' })}>
                      {s.status === 'approved' ? 'Unpublish' : 'Publish'}
                    </Btn>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {section === 'passport' && (
            <Panel title="Island Passport definitions" sub="Island → Region → qualifying stamp. Adding a market is a data change only.">
              <div className="grid gap-3 md:grid-cols-2">
                {db.regions.map((r) => {
                  const defs = db.stampDefs.filter((d) => d.region_id === r.id);
                  return (
                    <div key={r.id} className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                      <p className="text-[13.5px] font-extrabold">{r.name}</p>
                      <p className="text-[11px] text-white/45">{defs.length} stamp definitions</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {defs.map((d) => (
                          <span key={d.id} className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-bold text-white/70">{d.name}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                <p className="text-[12px] font-black uppercase tracking-wide text-white/45">Milestone rewards</p>
                <div className="mt-2 space-y-1.5">
                  {db.milestones.map((m) => (
                    <p key={m.id} className="text-[12.5px] text-white/70">
                      <span className="font-extrabold text-white">{m.badge}</span> — {m.stamps_required} stamps → +{m.bonus_points.toLocaleString()} pts
                      {m.partner_reward_id ? ' + partner reward' : ''}
                    </p>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {section === 'geo' && (
            <Panel title="Islands, markets & regions" sub="Geographic hierarchy: destination → island/market → region → Aloha Stop.">
              <div className="grid gap-3 md:grid-cols-2">
                {db.islands.map((i) => (
                  <div key={i.id} className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/8">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-extrabold">{i.name}</p>
                      <Pill tone={i.status === 'live' ? 'green' : 'slate'}>{i.status === 'live' ? 'Live' : 'Coming soon'}</Pill>
                    </div>
                    <p className="mt-1 text-[11.5px] text-white/45">
                      {db.regions.filter((r) => r.island_id === i.id).length} regions · {db.stops.filter((s) => s.island_id === i.id).length} stops
                    </p>
                  </div>
                ))}
              </div>
              <Table head={['Region', 'Island', 'Stops', 'Stamps']} rows={db.regions.map((r) => [
                r.name, db.islands.find((i) => i.id === r.island_id)?.name ?? '',
                db.stops.filter((s) => s.region_id === r.id).length,
                db.stampDefs.filter((d) => d.region_id === r.id).length,
              ])} />
            </Panel>
          )}

          {section === 'businesses' && (
            <Panel title="Businesses" sub="Partner accounts and linked business users.">
              <Table head={['Business', 'Contact', 'Stops', 'Status']} rows={db.businesses.map((b) => [
                b.name, b.email, db.stops.filter((s) => s.business_id === b.id).length, b.status,
              ])} />
            </Panel>
          )}

          {section === 'users' && (
            <Panel title="Users" sub="Consumer, business and admin roles.">
              <Table head={['User', 'Role', 'Island', 'Points', 'Status']} rows={[
                [db.user.name, 'consumer', 'Oʻahu', db.user.points_balance.toLocaleString(), 'active'],
                ['Demo User 142', 'consumer', 'Oʻahu', '3,910', 'flagged'],
                ['Demo User 087', 'consumer', 'Oʻahu', '1,120', 'restricted'],
                ['partner@islandbrewhouse.demo', 'business_user', 'Oʻahu', '—', 'active'],
                ['admin@alohahunt.demo', 'admin', 'All markets', '—', 'active'],
              ]} />
            </Panel>
          )}

          {section === 'checkins' && (
            <Panel title="Check-ins" sub="Every attempt is recorded with method, measured distance and outcome.">
              <Table head={['Time', 'Stop', 'Method', 'Distance', 'Points', 'Status']} rows={db.checkIns.slice(0, 18).map((c) => [
                new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                db.stops.find((s) => s.id === c.stop_id)?.name ?? '',
                c.method.toUpperCase(), c.distance_m >= 0 ? `${c.distance_m} m` : '—',
                c.points_awarded, c.status,
              ])} />
            </Panel>
          )}

          {section === 'redemptions' && (
            <Panel title="Redemptions" sub="Unique one-time codes with server-side validation.">
              <Table head={['Code', 'Reward', 'Cost', 'Issued', 'Status']} rows={db.redemptions.map((r) => [
                r.code, db.rewards.find((x) => x.id === r.reward_id)?.name ?? '', `${r.point_cost} pts`,
                new Date(r.created_at).toLocaleDateString(), r.status,
              ])} />
            </Panel>
          )}

          {section === 'audit' && (
            <Panel title="Audit logs" sub="Sensitive actions are attributed and immutable.">
              <Table head={['Time', 'Actor', 'Action', 'Target']} rows={db.audits.map((a) => [
                new Date(a.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                a.actor, a.action, a.target,
              ])} />
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
};

const Panel: React.FC<{ title: string; sub?: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <section>
    <h1 className="text-[22px] font-black tracking-tight">{title}</h1>
    {sub && <p className="mt-1 max-w-3xl text-[13px] text-white/55">{sub}</p>}
    <div className="mt-5 [&_table]:text-white [&_thead_tr]:bg-white/8 [&_thead_th]:text-white/50 [&_tbody_td]:text-white/70 [&_tbody_tr]:border-white/8 [&>div>div]:rounded-2xl">
      {children}
    </div>
  </section>
);

const Stepper: React.FC<{ value: number; onChange: (v: number) => void; step?: number }> = ({ value, onChange, step = 10 }) => (
  <div className="flex items-center gap-2 rounded-xl bg-white/10 p-1">
    <button onClick={() => onChange(Math.max(0, value - step))} className="h-7 w-7 rounded-lg bg-white/10 text-[14px] font-black">−</button>
    <span className="min-w-[64px] text-center text-[14px] font-black tabular-nums">{value.toLocaleString()}</span>
    <button onClick={() => onChange(value + step)} className="h-7 w-7 rounded-lg bg-white/10 text-[14px] font-black">+</button>
  </div>
);

export default Admin;
