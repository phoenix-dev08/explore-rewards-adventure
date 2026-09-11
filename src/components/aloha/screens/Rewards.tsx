import React, { useMemo, useState } from 'react';
import { useAloha } from '@/store/AlohaStore';
import { Btn, Card, Chip, HeaderBar, Icon, Pill, Points, SectionTitle, Sheet } from '../kit';
import { RewardCard, SaveButton, useHelpers } from '../cards';
import { rewardAvailability } from '@/lib/engine';
import { Redemption, Reward } from '@/data/types';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'food', label: 'Food & Drink' },
  { id: 'experience', label: 'Experiences' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'limited', label: 'Limited' },
  { id: 'saved', label: 'Saved' },
];

export const RewardsScreen: React.FC = () => {
  const { db, go } = useAloha();
  const [tab, setTab] = useState('recommended');

  const list = useMemo(() => {
    const approved = db.rewards.filter((r) => r.status === 'approved');
    if (tab === 'recommended') {
      return [...approved].sort((a, b) => {
        const aff = (r: Reward) => (db.user.points_balance >= r.point_cost ? 0 : 1);
        return aff(a) - aff(b) || a.point_cost - b.point_cost;
      });
    }
    if (tab === 'limited') return approved.filter((r) => r.limited);
    if (tab === 'saved') return approved.filter((r) => db.favorites.some((f) => f.entity_type === 'reward' && f.entity_id === r.id));
    if (tab === 'food') return approved.filter((r) => r.category === 'food');
    if (tab === 'experience') return approved.filter((r) => r.category === 'experience' || r.category === 'wellness');
    return approved.filter((r) => r.category === 'shopping');
  }, [db.rewards, db.favorites, db.user.points_balance, tab]);

  const mine = db.redemptions.filter((r) => r.status === 'unused');

  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="Rewards" subtitle="Redeem Aloha Points with island partners" />
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B4F6C] via-[#08405A] to-[#062B3F] p-5 text-white shadow-[0_22px_46px_-26px_rgba(6,43,63,.9)]">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#D4A853]/25 blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8FE3DC]">Your balance</p>
          <p className="mt-1 text-[38px] font-black leading-none"><Points value={db.user.points_balance} /></p>
          <p className="text-[12.5px] font-bold text-white/70">Aloha Points · no cash value</p>
          <div className="mt-3 flex gap-2">
            <Btn size="sm" variant="gold" icon="Ticket" onClick={() => go({ name: 'myrewards' })}>My Rewards {mine.length ? `(${mine.length})` : ''}</Btn>
            <Btn size="sm" variant="ghost" className="bg-white/12 text-white hover:bg-white/20" icon="History" onClick={() => go({ name: 'points' })}>Point history</Btn>
          </div>
        </div>

        <div className="scrollbar-none -mx-1 my-4 flex gap-2 overflow-x-auto px-1 pt-1">
          {TABS.map((t) => (
            <Chip key={t.id} active={tab === t.id} tone={t.id === 'limited' ? 'gold' : 'default'} onClick={() => setTab(t.id)}>{t.label}</Chip>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {list.map((r) => <RewardCard key={r.id} reward={r} onClick={() => go({ name: 'reward', id: r.id })} />)}
        </div>
        {!list.length && (
          <Card className="p-8 text-center">
            <Icon name="Gift" className="mx-auto mb-3 h-8 w-8 text-[#0B4F6C]/25" />
            <p className="text-[14px] font-extrabold text-[#062B3F]">Nothing saved here yet</p>
            <p className="mt-1 text-[12.5px] text-[#0B4F6C]/60">Tap the heart on any reward to save it for later.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export const RewardDetail: React.FC<{ id: string }> = ({ id }) => {
  const { db, back, go, doRedeem, toast } = useAloha();
  const h = useHelpers();
  const [confirm, setConfirm] = useState(false);
  const [issued, setIssued] = useState<Redemption | null>(null);

  const reward = db.rewards.find((r) => r.id === id);
  if (!reward) return <div className="p-10 text-center">Reward not found.</div>;
  const av = rewardAvailability(db as never, reward);
  const biz = h.business(reward.business_id);

  const [busy, setBusy] = useState(false);

  const redeem = async () => {
    setBusy(true);
    const res = await doRedeem(reward.id);
    setBusy(false);
    setConfirm(false);
    if (!res.ok) {
      toast({ title: res.message ?? 'Unable to redeem', body: res.detail, tone: 'error' });
      return;
    }
    setIssued(res.redemption!);
  };


  return (
    <div className="min-h-full bg-[#FBF7F0] pb-32">
      <div className="relative h-[250px]">
        <img src={reward.image} alt={reward.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#031A27]/45 via-transparent to-[#FBF7F0]" />
        <div className="absolute inset-x-0 top-0"><HeaderBar transparent onBack={back} right={<SaveButton type="reward" id={reward.id} floating className="h-10 w-10" />} /></div>
      </div>

      <div className="-mt-6 px-4">
        <div className="flex flex-wrap gap-1.5">
          {reward.limited && <Pill tone="gold" icon="Sparkles">Limited reward</Pill>}
          <Pill tone="slate" icon="Store">{biz?.name}</Pill>
          {av.soldOut && <Pill tone="coral" icon="XCircle">Sold out</Pill>}
        </div>
        <h1 className="mt-2.5 text-[26px] font-black leading-tight tracking-tight text-[#062B3F]">{reward.name}</h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#0B4F6C]/75">{reward.description}</p>

        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Point cost</p>
              <p className="text-[24px] font-black leading-none text-[#062B3F]">{reward.point_cost.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Your balance</p>
              <p className={cn('text-[24px] font-black leading-none', av.affordable ? 'text-[#2F855A]' : 'text-[#B23D2A]')}>
                <Points value={db.user.points_balance} />
              </p>
            </div>
          </div>
          {!av.affordable && (
            <p className="mt-3 rounded-2xl bg-[#FF6F59]/10 p-3 text-[12.5px] font-bold text-[#B23D2A]">
              You need {av.shortBy.toLocaleString()} more Aloha Points. Check in at a nearby Stop to close the gap.
            </p>
          )}
          <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-black/5 pt-3 text-center">
            {[
              ['Available', av.soldOut ? 'Sold out' : `${av.remaining} left`],
              ['Per member', `${reward.per_user_limit}`],
              ['Expires', new Date(reward.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{k}</p>
                <p className="mt-0.5 text-[12.5px] font-extrabold text-[#062B3F]">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        <SectionTitle className="mt-5" title="Redemption instructions" />
        <Card className="p-4 text-[13px] leading-relaxed text-[#0B4F6C]/75">{reward.redemption_instructions}</Card>

        <SectionTitle className="mt-5" title="Terms" />
        <Card className="p-4 text-[12.5px] leading-relaxed text-[#0B4F6C]/65">
          {reward.terms} Aloha Points are loyalty points with no cash value and cannot be transferred, sold or wagered.
        </Card>

        <button onClick={() => go({ name: 'stop', id: reward.stop_id })} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left ring-1 ring-black/5">
          <Icon name="MapPin" className="h-4 w-4 text-[#1FA9A3]" />
          <span className="flex-1 text-[13px] font-bold text-[#062B3F]">View participating Aloha Stop</span>
          <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/30" />
        </button>
      </div>

      <div className="sticky bottom-0 z-30 mt-6 border-t border-black/5 bg-[#FBF7F0]/95 px-4 pb-4 pt-3 backdrop-blur-xl">

        <Btn full size="lg" variant={av.affordable && !av.soldOut && !av.expired && !av.atUserLimit ? 'coral' : 'outline'}
          disabled={!av.affordable || av.soldOut || av.expired || av.atUserLimit}
          icon="Ticket" onClick={() => setConfirm(true)}>
          {av.soldOut ? 'Sold out' : av.expired ? 'Expired' : av.atUserLimit ? 'Limit reached' : !av.affordable ? `Need ${av.shortBy.toLocaleString()} more points` : `Redeem ${reward.point_cost.toLocaleString()} Points`}
        </Btn>
      </div>

      {/* confirm modal */}
      <Sheet open={confirm} onClose={() => setConfirm(false)} label="Confirm redemption">
        <div className="px-5 pb-6 pt-3 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6F59]/12">
            <Icon name="Ticket" className="h-7 w-7 text-[#FF6F59]" />
          </div>
          <h3 className="text-[19px] font-black text-[#062B3F]">Redeem this reward for {reward.point_cost.toLocaleString()} Aloha Points?</h3>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed text-[#0B4F6C]/65">
            Your balance will drop to {(db.user.points_balance - reward.point_cost).toLocaleString()} points. A unique one-time code is issued and validated server-side.
          </p>
          <div className="mt-5 space-y-2.5">
            <Btn full size="lg" variant="coral" icon="Check" disabled={busy} onClick={redeem}>{busy ? 'Validating…' : 'Confirm redemption'}</Btn>

            <Btn full variant="ghost" onClick={() => setConfirm(false)}>Cancel</Btn>
          </div>
        </div>
      </Sheet>

      {/* issued code */}
      <Sheet open={!!issued} onClose={() => { setIssued(null); go({ name: 'myrewards' }); }} label="Reward ready">
        {issued && <CodeView redemption={issued} reward={reward} onClose={() => { setIssued(null); go({ name: 'myrewards' }); }} />}
      </Sheet>
    </div>
  );
};

const QrBlock: React.FC<{ code: string }> = ({ code }) => {
  const cells = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) % 100000;
    const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    return Array.from({ length: 169 }, () => rand() > 0.52);
  }, [code]);
  return (
    <div className="mx-auto grid w-[168px] grid-cols-13 gap-[2px] rounded-2xl bg-white p-3 shadow-inner">
      {cells.map((on, i) => <span key={i} className={cn('aspect-square rounded-[1px]', on ? 'bg-[#062B3F]' : 'bg-transparent')} />)}
    </div>
  );
};

const CodeView: React.FC<{ redemption: Redemption; reward: Reward; onClose: () => void }> = ({ redemption, reward, onClose }) => {
  const h = useHelpers();
  const biz = h.business(reward.business_id);
  return (
    <div className="px-5 pb-7 pt-3 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F855A]/12">
        <Icon name="CircleCheckBig" className="h-7 w-7 text-[#2F855A]" />
      </div>
      <h3 className="text-[22px] font-black text-[#062B3F]">Reward Ready</h3>
      <p className="mt-1 text-[13px] font-semibold text-[#0B4F6C]/65">{reward.name}</p>
      <div className="mt-4 rounded-3xl border border-dashed border-[#0B4F6C]/20 bg-white p-5">
        <QrBlock code={redemption.code} />
        <p className="mt-3 font-mono text-[24px] font-black tracking-[0.12em] text-[#062B3F]">{redemption.code}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-[#0B4F6C]/12 pt-3 text-left">
          {[
            ['Status', 'Unused'],
            ['Partner', biz?.name ?? ''],
            ['Expires', new Date(redemption.expires_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[9.5px] font-black uppercase tracking-wide text-[#0B4F6C]/45">{k}</p>
              <p className="truncate text-[11.5px] font-extrabold text-[#062B3F]">{v}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-[#0B4F6C]/55">{reward.redemption_instructions}</p>
      <Btn full size="lg" variant="primary" className="mt-4" icon="Ticket" onClick={onClose}>View My Rewards</Btn>
    </div>
  );
};

export const MyRewards: React.FC = () => {
  const { db, back, go, markRedemptionUsed } = useAloha();
  const h = useHelpers();
  return (
    <div className="min-h-full bg-[#FBF7F0] pb-28">
      <HeaderBar title="My Rewards" onBack={back} subtitle="Redemption codes and history" />
      <div className="space-y-3 px-4">
        {db.redemptions.map((r) => {
          const reward = db.rewards.find((x) => x.id === r.reward_id);
          if (!reward) return null;
          const used = r.status !== 'unused';
          return (
            <Card key={r.id} className="overflow-hidden">
              <div className="flex gap-3 p-3.5">
                <img src={reward.image} alt="" className={cn('h-16 w-16 rounded-xl object-cover', used && 'grayscale')} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-extrabold leading-tight text-[#062B3F]">{reward.name}</p>
                    {used ? <Pill tone="slate">Redeemed</Pill> : <Pill tone="green">Unused</Pill>}
                  </div>
                  <p className="text-[11.5px] font-semibold text-[#0B4F6C]/60">{h.business(reward.business_id)?.name}</p>
                  <p className="mt-1 font-mono text-[15px] font-black tracking-[0.1em] text-[#062B3F]">{r.code}</p>
                  <p className="text-[11px] text-[#0B4F6C]/50">
                    {used ? `Used ${new Date(r.used_at ?? r.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' })}` : `Expires ${new Date(r.expires_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' })}`}
                  </p>
                </div>
              </div>
              {!used && (
                <div className="flex gap-2 border-t border-dashed border-black/8 px-3.5 py-2.5">
                  <Btn size="sm" variant="outline" className="flex-1" icon="Store" onClick={() => go({ name: 'stop', id: reward.stop_id })}>Find partner</Btn>
                  <Btn size="sm" variant="primary" className="flex-1" icon="ShieldCheck" onClick={() => markRedemptionUsed(r.id)}>Mark as Used</Btn>
                </div>
              )}
            </Card>
          );
        })}
        {!db.redemptions.length && (
          <Card className="p-8 text-center">
            <Icon name="Ticket" className="mx-auto mb-3 h-8 w-8 text-[#0B4F6C]/25" />
            <p className="text-[14px] font-extrabold text-[#062B3F]">No redemptions yet</p>
            <Btn size="sm" variant="outline" className="mt-4" onClick={() => go({ name: 'rewards' })}>Browse rewards</Btn>
          </Card>
        )}
        <p className="px-2 text-[11px] leading-relaxed text-[#0B4F6C]/45">
          “Mark as Used” represents partner-side verification. Once a code is used it cannot be reset by the member.
        </p>
      </div>
    </div>
  );
};
