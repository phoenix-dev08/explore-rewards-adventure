import React, { useEffect, useState } from 'react';
import { AlohaStop } from '@/data/types';
import { CheckInResult, useAloha } from '@/store/AlohaStore';
import { Btn, Icon, Points, Sheet } from '../kit';
import { checkInEligibility } from '@/lib/engine';
import { formatDistance } from '@/lib/geo';
import { useHelpers } from '../cards';
import { cn } from '@/lib/utils';

type Stage = 'choose' | 'gps' | 'qr' | 'result';

const CheckIn: React.FC<{ stop: AlohaStop; open: boolean; onClose: () => void }> = ({ stop, open, onClose }) => {
  const { db, doCheckIn, coords, locStatus, requestLocation, go, distanceTo } = useAloha();
  const h = useHelpers();
  const [stage, setStage] = useState<Stage>('choose');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => { if (open) { setStage('choose'); setResult(null); } }, [open]);

  const elig = checkInEligibility(db as never, stop);
  const dist = distanceTo(stop.coords);

  const runGps = async () => {
    setStage('gps');
    if (!coords) await requestLocation();
    const res = await doCheckIn(stop.id, 'gps');
    setResult(res);
    setStage('result');
    if (navigator.vibrate) navigator.vibrate(res.ok ? [14, 40, 22] : 40);
  };

  const runQr = async () => {
    setScanning(true);
    // Signed, short-lived payload verified server-side: <stopId>.<nonce>.<issuedAt>
    const res = await doCheckIn(stop.id, 'qr', null, `${stop.id}.${Math.random().toString(36).slice(2, 10)}.${Date.now()}`);
    setScanning(false);
    setResult(res);
    setStage('result');
    if (navigator.vibrate) navigator.vibrate([14, 40, 22]);
  };

  return (
    <Sheet open={open} onClose={onClose} label="Verify your visit" full={stage === 'result' && !!result?.ok}>
      {stage === 'choose' && (
        <div className="px-5 pb-5 pt-2">
          <div className="mb-1 flex items-center gap-2">
            <Icon name="ShieldCheck" className="h-5 w-5 text-[#1FA9A3]" />
            <h3 className="text-[20px] font-black text-[#062B3F]">Verify Your Visit</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-[#0B4F6C]/65">
            To protect Aloha Points and partner rewards, we verify qualifying visits. Verification runs server-side —
            your device never decides how many points you earn.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <img src={stop.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-extrabold text-[#062B3F]">{stop.name}</p>
              <p className="text-[12px] font-semibold text-[#0B4F6C]/60">
                {formatDistance(dist)} · geofence {stop.geofence_m} m
              </p>
            </div>
            <span className="rounded-xl bg-[#0B4F6C]/8 px-2.5 py-1.5 text-[12px] font-black text-[#0B4F6C]">+{elig.points}</span>
          </div>

          {elig.cooling && (
            <Notice tone="warn" icon="Clock" title="Cooldown active"
              body={`This Aloha Stop rewards points once every ${elig.rule.cooldown_hours} hours. You can qualify again ${elig.nextEligible ? elig.nextEligible.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'soon'}.`} />
          )}
          {locStatus === 'denied' && (
            <Notice tone="info" icon="LocateOff" title="Location is off"
              body="Enable location to verify by proximity, or scan the business QR code at the counter — both are accepted." />
          )}

          <div className="mt-4 space-y-2.5">
            <button onClick={runGps} className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-[#0B4F6C] to-[#062B3F] p-4 text-left text-white shadow-[0_16px_34px_-18px_rgba(6,43,63,.9)] transition active:scale-[.98]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><Icon name="LocateFixed" className="h-5 w-5" /></span>
              <span className="flex-1">
                <span className="block text-[15px] font-extrabold">Verify My Location</span>
                <span className="block text-[11.5px] text-white/65">High-accuracy GPS, requested only right now</span>
              </span>
              <Icon name="ChevronRight" className="h-5 w-5 text-white/60" />
            </button>
            <button
              onClick={() => setStage('qr')}
              disabled={!stop.qr_enabled}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-black/8 transition active:scale-[.98] disabled:opacity-45"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1FA9A3]/12"><Icon name="QrCode" className="h-5 w-5 text-[#1FA9A3]" /></span>
              <span className="flex-1">
                <span className="block text-[15px] font-extrabold text-[#062B3F]">Scan Business QR</span>
                <span className="block text-[11.5px] text-[#0B4F6C]/55">
                  {stop.qr_enabled ? 'Signed code, valid for 60 seconds' : 'Not available at this Aloha Stop'}
                </span>
              </span>
              <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/35" />
            </button>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-[#0B4F6C]/45">
            <Icon name="Lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Aloha Hunt never tracks you in the background. Location is read once per verification and is not stored as a trail.
          </p>
        </div>
      )}

      {stage === 'gps' && (
        <div className="flex flex-col items-center px-6 pb-10 pt-6">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#1FA9A3]/20" />
            <span className="absolute inset-4 animate-pulse rounded-full bg-[#1FA9A3]/25" />
            <Icon name="LocateFixed" className="relative h-12 w-12 text-[#0B4F6C]" />
          </div>
          <h3 className="mt-5 text-[17px] font-black text-[#062B3F]">Checking proximity…</h3>
          <p className="mt-1.5 max-w-xs text-center text-[12.5px] text-[#0B4F6C]/60">
            Comparing your position against the server-side geofence for {stop.name}.
          </p>
        </div>
      )}

      {stage === 'qr' && (
        <div className="px-5 pb-6 pt-2">
          <h3 className="text-[19px] font-black text-[#062B3F]">Scan Business QR</h3>
          <p className="mt-1 text-[12.5px] text-[#0B4F6C]/65">Point the camera at the Aloha Hunt code at the register.</p>
          <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-3xl bg-[#031A27]">
            <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(60% 60% at 50% 45%, #0d5878, #031A27)' }} />
            <div className="absolute inset-10 rounded-2xl border-2 border-dashed border-white/25" />
            {[['left-8 top-8', 'border-l-4 border-t-4 rounded-tl-2xl'], ['right-8 top-8', 'border-r-4 border-t-4 rounded-tr-2xl'], ['left-8 bottom-8', 'border-l-4 border-b-4 rounded-bl-2xl'], ['right-8 bottom-8', 'border-r-4 border-b-4 rounded-br-2xl']].map(([pos, b]) => (
              <span key={pos} className={cn('absolute h-12 w-12 border-[#1FA9A3]', pos, b)} />
            ))}
            {scanning && <span className="absolute inset-x-10 top-10 h-0.5 animate-[ah-scan_1.6s_ease-in-out_infinite] bg-[#8FE3DC] shadow-[0_0_18px_#8FE3DC]" />}
            <div className="absolute inset-x-0 bottom-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              {scanning ? 'Verifying signed payload…' : 'Camera unavailable in preview'}
            </div>
          </div>
          <Btn full size="lg" variant="secondary" className="mt-4" icon="ScanLine" onClick={runQr} disabled={scanning}>
            {scanning ? 'Scanning…' : 'Simulate Valid QR'}
          </Btn>
          <Btn full variant="ghost" className="mt-2" onClick={() => setStage('choose')}>Back to options</Btn>
          <p className="mt-3 text-[11px] leading-relaxed text-[#0B4F6C]/45">
            Production codes are rotating, signed payloads (stop id + nonce + timestamp) validated server-side with replay protection.
          </p>
        </div>
      )}

      {stage === 'result' && result && (
        result.ok
          ? <Success stop={stop} result={result} onClose={onClose} onPassport={() => { onClose(); go({ name: 'passport' }); }} />
          : (
            <div className="px-5 pb-6 pt-3">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FF6F59]/12">
                <Icon name="MapPinOff" className="h-8 w-8 text-[#FF6F59]" />
              </div>
              <h3 className="text-center text-[20px] font-black text-[#062B3F]">{result.message}</h3>
              <p className="mx-auto mt-2 max-w-sm text-center text-[13px] leading-relaxed text-[#0B4F6C]/65">{result.detail}</p>
              {result.distance_m !== undefined && result.distance_m >= 0 && (
                <div className="mx-auto mt-4 w-fit rounded-2xl bg-white px-4 py-2.5 text-center ring-1 ring-black/5">
                  <p className="text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Measured distance</p>
                  <p className="text-[17px] font-black text-[#062B3F]">{formatDistance(result.distance_m)}</p>
                </div>
              )}
              <div className="mt-5 space-y-2.5">
                <Btn full size="lg" variant="primary" icon="Navigation"
                  onClick={() => window.open(`https://maps.google.com/?q=${stop.coords.lat},${stop.coords.lng}`, '_blank')}>
                  Get Directions
                </Btn>
                {stop.qr_enabled && result.failure === 'too_far' && (
                  <Btn full variant="outline" icon="QrCode" onClick={() => setStage('qr')}>Use QR verification instead</Btn>
                )}
                <Btn full variant="ghost" onClick={onClose}>Close</Btn>
              </div>
              <p className="mt-4 text-center text-[11px] text-[#0B4F6C]/45">
                No Aloha Points were awarded. This attempt was recorded for fraud review.
              </p>
            </div>
          )
      )}
    </Sheet>
  );
};

const Success: React.FC<{ stop: AlohaStop; result: CheckInResult; onClose: () => void; onPassport: () => void }> = ({ stop, result, onClose, onPassport }) => {
  const { db } = useAloha();
  const h = useHelpers();
  const stamp = result.stampId ? db.stampDefs.find((s) => s.id === result.stampId) : null;
  const completedHunt = result.huntProgressed?.find((x) => x.completed);
  const hunt = completedHunt ? db.hunts.find((x) => x.id === completedHunt.huntId) : null;
  const progressed = result.huntProgressed?.filter((x) => !x.completed) ?? [];

  return (
    <div className="relative overflow-hidden px-5 pb-8 pt-4">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-64 opacity-70" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(212,168,83,.35), transparent 70%)' }} />
      {/* particle burst */}
      <div className="pointer-events-none absolute left-1/2 top-16 h-0 w-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-1.5 w-1.5 rounded-full"
            style={{
              background: i % 3 === 0 ? '#D4A853' : i % 3 === 1 ? '#1FA9A3' : '#FF9E4A',
              animation: `ah-burst .9s cubic-bezier(.2,.8,.3,1) ${i * 0.02}s forwards`,
              transform: `rotate(${i * 26}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center">
        <div className="animate-[ah-pop_.6s_cubic-bezier(.2,1.4,.4,1)] rounded-[28px] bg-gradient-to-br from-[#1FA9A3] to-[#0B4F6C] p-5 shadow-[0_24px_50px_-20px_rgba(11,79,108,.9)]">
          <Icon name="Check" className="h-10 w-10 text-white" strokeWidth={3} />
        </div>
        <h2 className="mt-4 text-[34px] font-black tracking-[0.14em] text-[#062B3F]">ALOHA!</h2>
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#1FA9A3]">Visit verified</p>

        <div className="mt-5 w-full rounded-3xl bg-white p-5 shadow-[0_18px_44px_-26px_rgba(6,43,63,.6)]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#0B4F6C]/65">{stop.name}</span>
            <span className="text-[26px] font-black text-[#062B3F]">+{result.points}</span>
          </div>
          <p className="text-right text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Aloha Points</p>

          {result.drop && (
            <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] p-3 text-white">
              <Icon name="Zap" className="h-5 w-5" />
              <span className="flex-1 text-[12.5px] font-extrabold">Aloha Drop qualified — +{result.drop.points} bonus</span>
            </div>
          )}

          {stamp && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#D4A853]/12 p-3 ring-1 ring-[#D4A853]/25">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-[#8A6414]/50 bg-white/70"
                style={{ animation: 'ah-stamp .7s cubic-bezier(.2,1.5,.3,1) .2s both' }}>
                <Icon name={stamp.icon} className="h-5 w-5 text-[#8A6414]" />
              </span>
              <span className="flex-1">
                <span className="block text-[10px] font-black uppercase tracking-wide text-[#8A6414]">Passport stamp earned</span>
                <span className="block text-[13.5px] font-extrabold text-[#062B3F]">{stamp.name} · {h.region(stamp.region_id)?.name}</span>
              </span>
            </div>
          )}

          {hunt && (
            <div className="mt-3 rounded-2xl bg-[#2F855A]/10 p-3 ring-1 ring-[#2F855A]/25">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#22633F]">Hunt complete</p>
              <p className="text-[14px] font-black text-[#062B3F]">{hunt.name}</p>
              <p className="mt-0.5 text-[12px] font-bold text-[#22633F]">
                +{hunt.completion_points.toLocaleString()} pts{completedHunt?.bonusPoints ? ` +${completedHunt.bonusPoints} bonus` : ''}
              </p>
            </div>
          )}

          {progressed.map((p) => {
            const hh = db.hunts.find((x) => x.id === p.huntId);
            const prog = db.huntProgress.find((x) => x.hunt_id === p.huntId);
            const req = db.huntStops.filter((x) => x.hunt_id === p.huntId && x.required).length;
            if (!hh) return null;
            return (
              <div key={p.huntId} className="mt-3 flex items-center gap-2.5 rounded-2xl bg-[#1FA9A3]/10 p-3">
                <Icon name="Flag" className="h-4 w-4 text-[#0B6B67]" />
                <span className="flex-1 text-[12.5px] font-bold text-[#062B3F]">{hh.name}</span>
                <span className="text-[12px] font-black text-[#0B6B67]">{prog?.completed_stop_ids.length ?? 0}/{req}</span>
              </div>
            );
          })}

          <div className="mt-4 border-t border-dashed border-[#0B4F6C]/12 pt-3 text-center">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">New balance</p>
            <p className="text-[24px] font-black text-[#062B3F]"><Points value={db.user.points_balance} /> <span className="text-[13px] font-bold text-[#0B4F6C]/50">Aloha Points</span></p>
          </div>
        </div>

        <div className="mt-5 w-full space-y-2.5">
          <Btn full size="lg" variant="gold" icon="Stamp" onClick={onPassport}>View Passport</Btn>
          <Btn full variant="outline" icon="Compass" onClick={onClose}>Continue Exploring</Btn>
        </div>
      </div>
    </div>
  );
};

const Notice: React.FC<{ tone: 'warn' | 'info'; icon: string; title: string; body: string }> = ({ tone, icon, title, body }) => (
  <div className={cn('mt-3 flex items-start gap-2.5 rounded-2xl p-3 ring-1',
    tone === 'warn' ? 'bg-[#D4A853]/12 ring-[#D4A853]/30' : 'bg-[#0B4F6C]/6 ring-[#0B4F6C]/12')}>
    <Icon name={icon} className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'warn' ? 'text-[#8A6414]' : 'text-[#0B4F6C]')} />
    <span>
      <span className="block text-[12.5px] font-extrabold text-[#062B3F]">{title}</span>
      <span className="block text-[12px] leading-relaxed text-[#0B4F6C]/65">{body}</span>
    </span>
  </div>
);

export default CheckIn;
