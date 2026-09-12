import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAloha } from '@/store/AlohaStore';
import { Btn, Card, Icon, Pill, Wordmark } from '@/components/aloha/kit';
import { cn } from '@/lib/utils';

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'profile', label: 'Business Profile', icon: 'Building2' },
  { id: 'stop', label: 'Aloha Stop', icon: 'MapPin' },
  { id: 'rewards', label: 'Rewards', icon: 'Gift' },
  { id: 'promotions', label: 'Promotions', icon: 'Tag' },
  { id: 'drops', label: 'Aloha Drops', icon: 'Zap' },
  { id: 'checkins', label: 'Check-ins', icon: 'CircleCheckBig' },
  { id: 'redemptions', label: 'Redemptions', icon: 'Ticket' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
];

const BIZ_ID = 'biz_brew';

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <Pill tone={status === 'approved' ? 'green' : status === 'pending' ? 'gold' : status === 'rejected' ? 'coral' : 'slate'}>
    {status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending approval' : status === 'rejected' ? 'Rejected' : 'Draft'}
  </Pill>
);

const Partner: React.FC = () => {
  const nav = useNavigate();
  const { db, updateStop, updateReward, addSubmission, toast, logAudit } = useAloha();
  const [section, setSection] = useState('overview');
  const [form, setForm] = useState({ title: '', kind: 'promotion' as 'promotion' | 'reward' | 'drop' });

  const biz = db.businesses.find((b) => b.id === BIZ_ID);
  const stop = db.stops.find((s) => s.business_id === BIZ_ID);
  if (!biz || !stop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1EA] px-6 text-center">
        <Wordmark size="md" />
        <h1 className="mt-6 text-[20px] font-black text-[#062B3F]">Partner Portal requires a session</h1>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#0B4F6C]/65">
          Sign in from the consumer app (the demo account works), then switch your role to <strong>Partner</strong> in
          Profile › Role &amp; operator surfaces. Row-level security controls what a business user may read and write.
        </p>
        <Btn className="mt-5" variant="primary" icon="Smartphone" onClick={() => nav('/')}>Go to the app</Btn>
      </div>
    );
  }

  const rewards = db.rewards.filter((r) => r.business_id === BIZ_ID);
  const drops = db.drops.filter((d) => d.stop_id === stop.id);
  const promos = db.promotions.filter((p) => p.stop_id === stop.id);
  const checkIns = db.checkIns.filter((c) => c.stop_id === stop.id);
  const redemptions = db.redemptions.filter((r) => rewards.some((x) => x.id === r.reward_id));
  const submissions = db.submissions.filter((s) => s.business_id === BIZ_ID);
  const todayVisits = checkIns.filter((c) => Date.now() - new Date(c.created_at).getTime() < 86400_000 && c.status === 'verified').length;

  const weekly = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    visits: [18, 24, 21, 32, 44, 58, 39][i] + (i === 6 ? todayVisits : 0),
    redemptions: [3, 5, 4, 6, 9, 12, 7][i],
  })), [todayVisits]);
  const maxVisits = Math.max(...weekly.map((w) => w.visits));

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-black/5 bg-white/90 px-5 py-3 backdrop-blur-xl">
        <Wordmark size="sm" />
        <span className="hidden rounded-full bg-[#1FA9A3]/12 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#0B6B67] sm:inline">Partner Portal</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[12.5px] font-extrabold text-[#062B3F]">{biz.name}</p>
            <p className="text-[11px] text-[#0B4F6C]/55">Business user · {biz.email}</p>
          </div>
          <Btn size="sm" variant="outline" icon="Smartphone" onClick={() => nav('/')}>Consumer app</Btn>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <nav className="sticky top-[78px] space-y-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setSection(n.id)}
                className={cn('flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-bold transition',
                  section === n.id ? 'bg-[#0B4F6C] text-white' : 'text-[#0B4F6C]/70 hover:bg-white')}>
                <Icon name={n.icon} className="h-4 w-4" />{n.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="scrollbar-none mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setSection(n.id)}
                className={cn('shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold', section === n.id ? 'bg-[#0B4F6C] text-white' : 'bg-white text-[#0B4F6C]/70')}>
                {n.label}
              </button>
            ))}
          </div>

          {section === 'overview' && (
            <>
              <h1 className="text-[24px] font-black tracking-tight text-[#062B3F]">Aloha, {biz.name}</h1>
              <p className="mt-1 text-[13.5px] text-[#0B4F6C]/60">Live performance for your Aloha Stop, rewards and campaigns.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['Qualifying visits today', todayVisits, 'CircleCheckBig', '#1FA9A3'],
                  ['Total check-ins', checkIns.filter((c) => c.status === 'verified').length, 'Users', '#0B4F6C'],
                  ['Active rewards', rewards.filter((r) => r.status === 'approved').length, 'Gift', '#FF6F59'],
                  ['Reward redemptions', redemptions.length, 'Ticket', '#D4A853'],
                ].map(([label, value, icon, tone]) => (
                  <Card key={String(label)} className="p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${tone}1A` }}>
                      <Icon name={icon as string} className="h-4 w-4" style={{ color: tone as string }} />
                    </span>
                    <p className="mt-2.5 text-[26px] font-black leading-none text-[#062B3F]">{value as number}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#0B4F6C]/50">{label as string}</p>
                  </Card>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Card className="p-5 lg:col-span-2">
                  <p className="text-[13px] font-black uppercase tracking-wide text-[#0B4F6C]/50">Campaign performance — last 7 days</p>
                  <div className="mt-5 flex h-44 items-end gap-3">
                    {weekly.map((w) => (
                      <div key={w.day} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex w-full flex-1 items-end gap-1">
                          <div className="flex-1 rounded-t-lg bg-gradient-to-t from-[#0B4F6C] to-[#1FA9A3]" style={{ height: `${(w.visits / maxVisits) * 100}%` }} />
                          <div className="flex-1 rounded-t-lg bg-[#FF9E4A]/70" style={{ height: `${(w.redemptions / maxVisits) * 100 * 3}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-[#0B4F6C]/55">{w.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4 text-[11.5px] font-bold text-[#0B4F6C]/60">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#1FA9A3]" />Verified visits</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FF9E4A]" />Redemptions</span>
                  </div>
                </Card>

                <Card className="p-5">
                  <p className="text-[13px] font-black uppercase tracking-wide text-[#0B4F6C]/50">Active Aloha Drop</p>
                  {drops.filter((d) => d.status === 'live').map((d) => (
                    <div key={d.id} className="mt-3 rounded-2xl bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] p-4 text-white">
                      <p className="text-[15px] font-black">{d.title}</p>
                      <p className="mt-1 text-[12px] text-white/80">+{d.points} pts · {d.quantity_total - d.quantity_claimed} of {d.quantity_total} remaining</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
                        <div className="h-full rounded-full bg-white" style={{ width: `${(d.quantity_claimed / d.quantity_total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {!drops.some((d) => d.status === 'live') && <p className="mt-3 text-[12.5px] text-[#0B4F6C]/55">No live Drop right now.</p>}
                  <p className="mt-4 text-[13px] font-black uppercase tracking-wide text-[#0B4F6C]/50">Submissions</p>
                  <div className="mt-2 space-y-2">
                    {submissions.slice(0, 4).map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-xl bg-[#F4F1EA] p-2.5">
                        <Icon name={s.kind === 'drop' ? 'Zap' : s.kind === 'reward' ? 'Gift' : 'Tag'} className="h-4 w-4 text-[#0B4F6C]/50" />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#062B3F]">{s.title}</span>
                        <StatusPill status={s.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {section === 'profile' && (
            <Card className="p-6">
              <h2 className="text-[20px] font-black text-[#062B3F]">Business Profile</h2>
              <p className="mt-1 text-[13px] text-[#0B4F6C]/60">Changes to public fields go live in the consumer app immediately for demo purposes.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Business name', value: stop.name, onSave: (v: string) => updateStop(stop.id, { name: v }) },
                  { label: 'Tagline', value: stop.tagline, onSave: (v: string) => updateStop(stop.id, { tagline: v }) },
                  { label: 'Address', value: stop.address, onSave: (v: string) => updateStop(stop.id, { address: v }) },
                  { label: 'Geofence radius (m)', value: String(stop.geofence_m), onSave: (v: string) => updateStop(stop.id, { geofence_m: Number(v) || stop.geofence_m }) },
                ].map((f) => <EditableField key={f.label} {...f} />)}
              </div>
              <div className="mt-5">
                <p className="text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Gallery</p>
                <div className="mt-2 flex gap-2">
                  {stop.images.map((im) => <img key={im} src={im} alt="" className="h-20 w-28 rounded-xl object-cover" />)}
                  <button onClick={() => toast({ title: 'Upload stub', body: 'Image upload uses signed storage URLs in production.', tone: 'info' })}
                    className="flex h-20 w-28 items-center justify-center rounded-xl border-2 border-dashed border-[#0B4F6C]/20 text-[#0B4F6C]/40">
                    <Icon name="Upload" className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Btn variant="primary" icon="Eye" onClick={() => nav('/')}>Preview Aloha Stop</Btn>
                <Btn variant="outline" icon="Clock" onClick={() => toast({ title: 'Hours editor', body: 'Weekly hours are stored per day on the aloha_stops record.', tone: 'info' })}>Manage hours</Btn>
              </div>
            </Card>
          )}

          {section === 'stop' && (
            <Card className="overflow-hidden">
              <img src={stop.images[0]} alt="" className="h-52 w-full object-cover" />
              <div className="p-6">
                <h2 className="text-[20px] font-black text-[#062B3F]">{stop.name}</h2>
                <p className="mt-1 text-[13px] text-[#0B4F6C]/60">{stop.tagline}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Points per visit', db.pointRules.find((r) => r.id === stop.point_rule_id)?.points ?? 0],
                    ['Geofence', `${stop.geofence_m} m`],
                    ['QR verification', stop.qr_enabled ? 'Enabled' : 'Disabled'],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="rounded-2xl bg-[#F4F1EA] p-3.5">
                      <p className="text-[10.5px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{k as string}</p>
                      <p className="mt-0.5 text-[16px] font-black text-[#062B3F]">{v as string}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[12px] text-[#0B4F6C]/55">
                  Point values are set by Aloha Hunt admin (point rule <span className="font-mono">{stop.point_rule_id}</span>) — partners cannot change earning rates.
                </p>
              </div>
            </Card>
          )}

          {(section === 'rewards' || section === 'promotions' || section === 'drops') && (
            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="text-[18px] font-black text-[#062B3F]">
                  Submit a {section === 'rewards' ? 'reward' : section === 'promotions' ? 'promotion' : 'Drop request'}
                </h2>
                <p className="mt-1 text-[12.5px] text-[#0B4F6C]/60">Partner-created public content requires admin approval before it goes live.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={section === 'rewards' ? 'e.g. Free cold brew flight' : section === 'promotions' ? 'e.g. Sunrise happy hour' : 'e.g. Friday Cold Brew Drop'}
                    className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-[13.5px] font-semibold outline-none focus:border-[#1FA9A3]" />
                  <Btn variant="primary" icon="Send" onClick={() => {
                    if (!form.title.trim()) return toast({ title: 'Add a title first', tone: 'error' });
                    addSubmission({ business_id: BIZ_ID, kind: section === 'rewards' ? 'reward' : section === 'promotions' ? 'promotion' : 'drop', title: form.title.trim() });
                    setForm({ ...form, title: '' });
                  }}>Submit for approval</Btn>
                </div>
              </Card>

              {section === 'rewards' && rewards.map((r) => (
                <Card key={r.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <img src={r.image} alt="" className="h-20 w-28 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-extrabold text-[#062B3F]">{r.name}</p>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="mt-1 text-[12.5px] text-[#0B4F6C]/60">{r.point_cost.toLocaleString()} pts · {r.quantity_claimed}/{r.quantity_total} claimed · limit {r.per_user_limit}/member</p>
                  </div>
                  <Btn size="sm" variant={r.status === 'approved' ? 'outline' : 'secondary'}
                    onClick={() => { updateReward(r.id, { status: r.status === 'approved' ? 'paused' : 'approved' }); logAudit(biz.email, r.status === 'approved' ? 'Paused reward' : 'Resumed reward', r.name); }}>
                    {r.status === 'approved' ? 'Pause' : 'Resume'}
                  </Btn>
                </Card>
              ))}

              {section === 'promotions' && promos.map((p) => (
                <Card key={p.id} className="flex items-center gap-3 p-4">
                  <Icon name="Tag" className="h-5 w-5 text-[#FF6F59]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold text-[#062B3F]">{p.title}</p>
                    <p className="text-[12px] text-[#0B4F6C]/60">{p.detail}</p>
                  </div>
                  <StatusPill status={p.status} />
                </Card>
              ))}

              {section === 'drops' && drops.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <Icon name="Zap" className="h-5 w-5 text-[#FF6F59]" />
                    <p className="text-[15px] font-extrabold text-[#062B3F]">{d.title}</p>
                    <Pill tone={d.status === 'live' ? 'coral' : 'slate'}>{d.status}</Pill>
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-[#0B4F6C]/60">
                    +{d.points} pts · {d.quantity_claimed}/{d.quantity_total} claimed · window{' '}
                    {new Date(d.starts_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' })} → {new Date(d.ends_at).toLocaleString(undefined, { hour: 'numeric' })}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {section === 'checkins' && (
            <Card className="overflow-hidden">
              <Table
                head={['Time', 'Method', 'Distance', 'Points', 'Status']}
                rows={checkIns.slice(0, 14).map((c) => [
                  new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                  c.method.toUpperCase(),
                  c.distance_m >= 0 ? `${c.distance_m} m` : '—',
                  c.points_awarded ? `+${c.points_awarded}` : '0',
                  c.status === 'verified' ? 'Verified' : `Rejected (${c.reject_reason ?? ''})`,
                ])}
              />
            </Card>
          )}

          {section === 'redemptions' && (
            <Card className="overflow-hidden">
              <Table
                head={['Code', 'Reward', 'Issued', 'Cost', 'Status']}
                rows={redemptions.map((r) => [
                  r.code,
                  db.rewards.find((x) => x.id === r.reward_id)?.name ?? '',
                  new Date(r.created_at).toLocaleDateString(),
                  `${r.point_cost} pts`,
                  r.status === 'unused' ? 'Unused' : 'Redeemed',
                ])}
              />
              {!redemptions.length && <p className="p-6 text-center text-[13px] text-[#0B4F6C]/55">No redemptions for this business yet — redeem the coffee reward in the consumer app to see one appear here.</p>}
            </Card>
          )}

          {section === 'analytics' && (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Verified visit conversion', '68%', 'Visits that passed geofence or QR verification'],
                ['Avg. points per visitor', `${db.pointRules.find((r) => r.id === stop.point_rule_id)?.points ?? 0}`, 'Set by admin point rule'],
                ['Reward redemption rate', '14.2%', 'Redemptions ÷ qualifying visits'],
                ['Repeat visitors (30d)', '31%', 'Members with 2+ verified visits'],
              ].map(([k, v, s]) => (
                <Card key={k} className="p-5">
                  <p className="text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{k}</p>
                  <p className="mt-1 text-[30px] font-black leading-none text-[#062B3F]">{v}</p>
                  <p className="mt-1.5 text-[12px] text-[#0B4F6C]/55">{s}</p>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const EditableField: React.FC<{ label: string; value: string; onSave: (v: string) => void }> = ({ label, value, onSave }) => {
  const [v, setV] = useState(value);
  const dirty = v !== value;
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{label}</span>
      <span className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)}
          className="flex-1 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13.5px] font-semibold text-[#062B3F] outline-none focus:border-[#1FA9A3]" />
        <Btn size="sm" variant={dirty ? 'secondary' : 'outline'} disabled={!dirty} onClick={() => onSave(v)}>Save</Btn>
      </span>
    </label>
  );
};

export const Table: React.FC<{ head: string[]; rows: (string | number)[][] }> = ({ head, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[520px] text-left">
      <thead>
        <tr className="border-b border-black/5 bg-[#F4F1EA]">
          {head.map((h) => <th key={h} className="px-4 py-3 text-[10.5px] font-black uppercase tracking-wide text-[#0B4F6C]/50">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-black/5 last:border-0">
            {r.map((cell, j) => (
              <td key={j} className={cn('px-4 py-3 text-[12.5px]', j === 0 ? 'font-mono font-bold text-[#062B3F]' : 'font-semibold text-[#0B4F6C]/70')}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Partner;
