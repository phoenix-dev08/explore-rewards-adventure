import React, { useEffect, useRef, useState } from 'react';
import { AlohaStop } from '@/data/types';
import { CheckInResult, useAloha } from '@/store/AlohaStore';
import { Btn, CooldownClock, Icon, Points, Sheet } from '../kit';
import AlohaCollect from '../AlohaCollect';
import { formatDistance } from '@/lib/geo';
import { useHelpers } from '../cards';
import { cn } from '@/lib/utils';

type Stage = 'arrive' | 'collect' | 'gps' | 'qr' | 'result';

const CheckIn: React.FC<{ stop: AlohaStop; open: boolean; onClose: () => void }> = ({ stop, open, onClose }) => {
  const { doCheckIn, coords, locStatus, requestLocation, go, distanceTo, stopEligibility } = useAloha();
  const [stage, setStage] = useState<Stage>('arrive');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [qrHint, setQrHint] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const elig = stopEligibility(stop);
  const dist = distanceTo(stop.coords);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setResult(null);
    if (elig.interactionCooling) setStage('arrive');
    else if (elig.inRange) setStage('collect');
    else setStage('arrive');
  }, [open, stop.id, elig.inRange, elig.interactionCooling]);

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const runGps = async () => {
    setStage('gps');
    if (!coords) await requestLocation();
    const res = await doCheckIn(stop.id, 'gps');
    setResult(res);
    setStage('result');
    if (navigator.vibrate) navigator.vibrate(res.ok ? [14, 40, 22] : 40);
  };

  const runQr = async (payload?: string) => {
    setScanning(true);
    const nonce = payload ?? `${stop.id}.${Math.random().toString(36).slice(2, 10)}.${Date.now()}`;
    const res = await doCheckIn(stop.id, 'qr', null, nonce);
    setScanning(false);
    stopCamera();
    setResult(res);
    setStage('result');
    if (navigator.vibrate) navigator.vibrate([14, 40, 22]);
  };

  const startCamera = async () => {
    setStage('qr');
    setQrHint('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (Detector && videoRef.current) {
        const det = new Detector({ formats: ['qr_code'] });
        const loop = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await det.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) { await runQr(value); return; }
          } catch { /* keep scanning */ }
          window.setTimeout(loop, 350);
        };
        void loop();
      } else {
        setQrHint('Live QR decode is not available in this browser. Use the demo scan below, or a partner code on device.');
      }
    } catch {
      setQrHint('Camera permission was blocked. You can still simulate a signed partner code in this preview.');
    }
  };

  return (
    <Sheet open={open} onClose={() => { stopCamera(); onClose(); }} label="Collect Aloha Stop" full={stage === 'collect' || stage === 'gps' || (stage === 'result' && !!result?.ok)}>
      {stage === 'arrive' && (
        <div className="px-5 pb-5 pt-2">
          <div className="mb-1 flex items-center gap-2">
            <Icon name="Compass" className="h-5 w-5 text-[#1FA9A3]" />
            <h3 className="text-[20px] font-black text-[#062B3F]">
              {elig.interactionCooling ? 'Stop cooling down' : elig.inRange ? 'You’re here' : 'Travel to this Stop'}
            </h3>
          </div>
          <p className="text-[13px] leading-relaxed text-[#0B4F6C]/65">
            Aloha Stops only open inside a {stop.geofence_m} m geofence. Collecting is a branded interaction —
            then we verify the visit server-side so points cannot be farmed from the couch.
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

          {elig.interactionCooling && elig.interactionReadyAt && (
            <Notice tone="warn" icon="Clock" title="Interaction cooldown"
              body={`Same-Stop farming is blocked. ${elig.interactionMinutes}-minute cooldown is admin-configurable and separate from point eligibility.`} />
          )}
          {elig.interactionCooling && elig.interactionReadyAt && (
            <div className="mt-3 rounded-2xl bg-[#062B3F] px-4 py-3 text-center text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Available again in</p>
              <CooldownClock until={elig.interactionReadyAt} prefix="" className="text-[28px] font-black text-[#E7C577]" />
            </div>
          )}
          {elig.pointsCooling && !elig.interactionCooling && (
            <Notice tone="info" icon="Coins" title="Points already earned for this window"
              body={`You can still collect after the interaction cooldown. Full Aloha Points return ${elig.pointsReadyAt ? elig.pointsReadyAt.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'later'}. Passport and Hunt progress stay one-time.`} />
          )}
          {elig.stampAlreadyOwned && (
            <Notice tone="info" icon="Stamp" title="Passport stamp already earned" body="This Stop’s Island Passport stamp is one-time. Future collects won’t re-stamp it." />
          )}
          {elig.huntsThatCount.some((x) => x.already) && (
            <Notice tone="info" icon="Flag" title="Hunt checkpoint already counted"
              body={elig.huntsThatCount.filter((x) => x.already).map((x) => x.name).join(', ')} />
          )}
          {locStatus === 'denied' && (
            <Notice tone="info" icon="LocateOff" title="Location is off"
              body="Enable location to collect by proximity, or scan the business QR at the counter." />
          )}
          {!elig.inRange && !elig.interactionCooling && coords && (
            <Notice tone="warn" icon="MapPinOff" title="Outside the geofence"
              body={`Get within ${stop.geofence_m} m to activate this Stop. ${formatDistance(dist)} now.`} />
          )}
          {!coords && locStatus !== 'denied' && (
            <Notice tone="info" icon="LocateFixed" title="Location needed to collect"
              body="We only read GPS at collect time — never as a background trail." />
          )}

          <div className="mt-4 space-y-2.5">
            {elig.inRange && elig.canInteract && (
              <button onClick={() => setStage('collect')} className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-[#1FA9A3] to-[#0B4F6C] p-4 text-left text-white shadow-[0_16px_34px_-18px_rgba(6,43,63,.9)] transition active:scale-[.98]">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><Icon name="Sparkles" className="h-5 w-5" /></span>
                <span className="flex-1">
                  <span className="block text-[15px] font-extrabold">Collect this Aloha Stop</span>
                  <span className="block text-[11.5px] text-white/65">Hold the puka, then swipe the swell</span>
                </span>
                <Icon name="ChevronRight" className="h-5 w-5 text-white/60" />
              </button>
            )}
            {!elig.inRange && !elig.interactionCooling && (
              <>
                <Btn full size="lg" variant="primary" icon="LocateFixed" onClick={() => { void requestLocation(); }}>
                  {coords ? 'Recheck my location' : 'Share location'}
                </Btn>
                <Btn full variant="outline" icon="Navigation"
                  onClick={() => window.open(`https://maps.google.com/?q=${stop.coords.lat},${stop.coords.lng}`, '_blank')}>
                  Get directions
                </Btn>
              </>
            )}
            <button
              onClick={() => void startCamera()}
              disabled={!stop.qr_enabled || elig.interactionCooling}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-black/8 transition active:scale-[.98] disabled:opacity-45"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1FA9A3]/12"><Icon name="QrCode" className="h-5 w-5 text-[#1FA9A3]" /></span>
              <span className="flex-1">
                <span className="block text-[15px] font-extrabold text-[#062B3F]">Scan business QR</span>
                <span className="block text-[11.5px] text-[#0B4F6C]/55">
                  {stop.qr_enabled ? 'Signed partner code — extra verification' : 'Not available at this Aloha Stop'}
                </span>
              </span>
              <Icon name="ChevronRight" className="h-5 w-5 text-[#0B4F6C]/35" />
            </button>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-[#0B4F6C]/45">
            <Icon name="Lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Aloha Hunt never tracks you in the background. Location is read once per collect. Points, stamps, and Hunt progress are decided on the server.
          </p>
        </div>
      )}

      {stage === 'collect' && (
        <div className="flex min-h-full flex-col bg-[#031A27] px-5 pb-8 pt-7 text-white">
          <button type="button" onClick={() => setStage('arrive')} className="self-start text-[12px] font-black uppercase tracking-[0.16em] text-white/55">
            Back
          </button>
          <p className="mt-6 text-center text-[13px] font-black uppercase tracking-[0.2em] text-[#E7C577]">🌺 Aloha Stop in range!</p>
          <h3 className="mt-2 text-center text-[28px] font-black leading-tight">{stop.name}</h3>
          <p className="mx-auto mt-2 max-w-sm text-center text-[13px] leading-relaxed text-white/65">
            Hold the puka, then swipe the swell. This interaction is original to Aloha Hunt.
          </p>
          <div className="mt-5 rounded-[28px] bg-[#FBF7F0] px-3 py-4 text-[#062B3F]">
            <AlohaCollect stopName={stop.name} onCollected={() => void runGps()} />
          </div>
        </div>
      )}

      {stage === 'gps' && (
        <div className="flex min-h-full flex-col items-center justify-center bg-[#031A27] px-6 pb-10 pt-6 text-white">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#1FA9A3]/25" />
            <span className="absolute inset-4 animate-pulse rounded-full bg-[#1FA9A3]/30" />
            <Icon name="LocateFixed" className="relative h-12 w-12 text-[#8FE3DC]" />
          </div>
          <h3 className="mt-5 text-[20px] font-black">Collecting…</h3>
          <p className="mt-1.5 max-w-xs text-center text-[13px] text-white/60">
            Verifying you’re inside the geofence for {stop.name}.
          </p>
        </div>
      )}

      {stage === 'qr' && (
        <div className="px-5 pb-6 pt-2">
          <h3 className="text-[19px] font-black text-[#062B3F]">Scan business QR</h3>
          <p className="mt-1 text-[12.5px] text-[#0B4F6C]/65">Point the camera at the Aloha Hunt code at the register.</p>
          <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-3xl bg-[#031A27]">
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
            <div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-dashed border-white/25" />
            {[['left-8 top-8', 'border-l-4 border-t-4 rounded-tl-2xl'], ['right-8 top-8', 'border-r-4 border-t-4 rounded-tr-2xl'], ['left-8 bottom-8', 'border-l-4 border-b-4 rounded-bl-2xl'], ['right-8 bottom-8', 'border-r-4 border-b-4 rounded-br-2xl']].map(([pos, b]) => (
              <span key={pos} className={cn('pointer-events-none absolute h-12 w-12 border-[#1FA9A3]', pos, b)} />
            ))}
            {scanning && <span className="absolute inset-x-10 top-10 h-0.5 animate-[ah-scan_1.6s_ease-in-out_infinite] bg-[#8FE3DC] shadow-[0_0_18px_#8FE3DC]" />}
            <div className="absolute inset-x-0 bottom-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              {scanning ? 'Verifying signed payload…' : 'Align the partner code'}
            </div>
          </div>
          {qrHint && <p className="mt-3 text-[12px] leading-relaxed text-[#0B4F6C]/60">{qrHint}</p>}
          <Btn full size="lg" variant="secondary" className="mt-4" icon="ScanLine" onClick={() => void runQr()} disabled={scanning}>
            {scanning ? 'Scanning…' : 'Use demo partner code'}
          </Btn>
          <Btn full variant="ghost" className="mt-2" onClick={() => { stopCamera(); setStage('arrive'); }}>Back to options</Btn>
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
                  <Btn full variant="outline" icon="QrCode" onClick={() => void startCamera()}>Use QR verification instead</Btn>
                )}
                <Btn full variant="ghost" onClick={onClose}>Close</Btn>
              </div>
              {result.failure !== 'network' && (
                <p className="mt-4 text-center text-[11px] text-[#0B4F6C]/45">
                  No Aloha Points were awarded. This attempt was recorded for fraud review.
                </p>
              )}
            </div>
          )
      )}
    </Sheet>
  );
};

const Success: React.FC<{ stop: AlohaStop; result: CheckInResult; onClose: () => void; onPassport: () => void }> = ({ stop, result, onClose, onPassport }) => {
  const { db, go, stopEligibility } = useAloha();
  const h = useHelpers();
  const elig = stopEligibility(stop);
  const stamp = result.stampId ? db.stampDefs.find((s) => s.id === result.stampId) : null;
  const completedHunt = result.huntProgressed?.find((x) => x.completed);
  const huntLines = (result.huntProgressed ?? []).map((p) => {
    const hh = db.hunts.find((x) => x.id === p.huntId);
    const prog = db.huntProgress.find((x) => x.hunt_id === p.huntId);
    const req = db.huntStops.filter((x) => x.hunt_id === p.huntId && x.required).length;
    const done = prog?.completed_stop_ids.length ?? (p.completed ? req : 0);
    return hh ? { ...p, name: hh.name, done, req } : null;
  }).filter(Boolean) as { huntId: string; completed: boolean; name: string; done: number; req: number }[];

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-[#031A27] px-5 pb-8 pt-10 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-80" style={{ background: 'radial-gradient(55% 55% at 50% 30%, rgba(231,197,119,.45), transparent 70%)' }} />
      <div className="pointer-events-none absolute left-1/2 top-24 h-0 w-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-2 w-2 rounded-full"
            style={{
              background: i % 3 === 0 ? '#D4A853' : i % 3 === 1 ? '#1FA9A3' : '#FF9E4A',
              animation: `ah-burst 1s cubic-bezier(.2,.8,.3,1) ${i * 0.025}s forwards`,
              transform: `rotate(${i * 20}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-1 flex-col items-center">
        <div className="animate-[ah-pop_.6s_cubic-bezier(.2,1.4,.4,1)] rounded-[32px] bg-gradient-to-br from-[#E7C577] to-[#1FA9A3] p-6 shadow-[0_24px_50px_-16px_rgba(231,197,119,.8)]">
          <Icon name="Sparkles" className="h-11 w-11 text-[#031A27]" strokeWidth={2.4} />
        </div>
        <h2 className="mt-6 text-center text-[32px] font-black leading-[1.05] tracking-tight">
          ALOHA STOP COLLECTED! 🌺
        </h2>
        <p className="mt-1.5 text-[14px] font-bold text-white/65">{stop.name}</p>

        <div className="mt-6 w-full space-y-2.5">
          {(result.points ?? 0) > 0 && (
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/15" style={{ animation: 'ah-rise .45s ease .05s both' }}>
              <p className="text-[28px] font-black text-[#E7C577]">+{result.points} Aloha Points</p>
            </div>
          )}
          {stamp && (
            <div className="flex items-center gap-3 rounded-2xl bg-[#D4A853]/18 px-4 py-3 ring-1 ring-[#E7C577]/35" style={{ animation: 'ah-stamp .7s cubic-bezier(.2,1.5,.3,1) .12s both' }}>
              <span className="text-[22px]">🏝️</span>
              <span className="text-[16px] font-black leading-tight">
                {h.region(stamp.region_id)?.name ?? stamp.name} Passport Stamp
              </span>
            </div>
          )}
          {huntLines.map((line) => (
            <div key={line.huntId} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/12" style={{ animation: 'ah-rise .45s ease .18s both' }}>
              <span className="text-[22px]">🏆</span>
              <span className="text-[16px] font-black leading-tight">
                {line.name} Progress {line.done}/{line.req}
                {line.completed ? ' — Complete!' : ''}
              </span>
            </div>
          ))}
          {result.drop && (
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#FF9E4A]/90 to-[#FF6F59]/90 px-4 py-3" style={{ animation: 'ah-rise .45s ease .24s both' }}>
              <span className="text-[22px]">⚡</span>
              <span className="text-[16px] font-black leading-tight">Aloha Drop Unlocked · +{result.drop.points}</span>
            </div>
          )}
          {elig.interactionReadyAt && (
            <div className="rounded-2xl bg-black/30 px-4 py-3 text-center ring-1 ring-white/10" style={{ animation: 'ah-rise .45s ease .3s both' }}>
              <p className="text-[15px] font-black text-[#E7C577]">
                🕐 Cooldown — <CooldownClock until={elig.interactionReadyAt} prefix="" />
              </p>
            </div>
          )}
          {completedHunt && (
            <p className="pt-1 text-center text-[12.5px] font-bold text-[#8FE3DC]">
              Hunt complete · bonus Aloha Points are on your ledger
            </p>
          )}
          <p className="pt-1 text-center text-[13px] font-bold text-white/50">
            Balance <Points value={db.user.points_balance} /> Aloha Points
          </p>
        </div>

        <div className="mt-auto w-full space-y-2.5 pt-8">
          <Btn full size="lg" variant="gold" icon="Stamp" onClick={onPassport}>View Passport</Btn>
          <Btn full variant="ghost" className="bg-white/10 text-white hover:bg-white/15" icon="Flag"
            onClick={() => { onClose(); if (huntLines[0]) go({ name: 'hunt', id: huntLines[0].huntId }); }}>
            See Hunt progress
          </Btn>
          <Btn full variant="ghost" className="text-white/80" icon="Compass" onClick={onClose}>Keep exploring</Btn>
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
