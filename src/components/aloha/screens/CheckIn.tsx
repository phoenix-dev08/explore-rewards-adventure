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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stop.id]);

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
    <Sheet open={open} onClose={() => { stopCamera(); onClose(); }} label="Collect Aloha Stop" full={stage === 'result' && !!result?.ok}>
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
        <div className="px-5 pb-6 pt-2">
          <h3 className="text-center text-[20px] font-black text-[#062B3F]">Collect {stop.name}</h3>
          <p className="mx-auto mt-1 max-w-sm text-center text-[12.5px] text-[#0B4F6C]/65">
            Original Aloha Hunt ritual — hold, then open the swell. This is not a copy of any other game’s stop interaction.
          </p>
          <AlohaCollect stopName={stop.name} onCollected={() => void runGps()} />
          <Btn full variant="ghost" className="mt-2" onClick={() => setStage('arrive')}>Back</Btn>
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
  const { db, stopEligibility } = useAloha();
  const h = useHelpers();
  const elig = stopEligibility(stop);
  const stamp = result.stampId ? db.stampDefs.find((s) => s.id === result.stampId) : null;
  const completedHunt = result.huntProgressed?.find((x) => x.completed);
  const hunt = completedHunt ? db.hunts.find((x) => x.id === completedHunt.huntId) : null;
  const progressed = result.huntProgressed?.filter((x) => !x.completed) ?? [];

  return (
    <div className="relative overflow-hidden px-5 pb-8 pt-4">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-64 opacity-70" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(212,168,83,.35), transparent 70%)' }} />
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
        <p className="mt-4 text-[12px] font-black uppercase tracking-[0.22em] text-[#1FA9A3]">🌺 Aloha Stop collected</p>
        <h2 className="mt-1 text-center text-[28px] font-black leading-tight tracking-tight text-[#062B3F]">
          ALOHA STOP COLLECTED!
        </h2>
        <p className="mt-1 text-[13px] font-bold text-[#0B4F6C]/60">{stop.name}</p>

        <div className="mt-5 w-full rounded-3xl bg-white p-5 shadow-[0_18px_44px_-26px_rgba(6,43,63,.6)]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#0B4F6C]/65">
              {(result.points ?? 0) > 0 ? 'Aloha Points' : result.soft ? 'Visit recorded' : 'Stop collected'}
            </span>
            <span className="text-[26px] font-black text-[#062B3F]">
              {(result.points ?? 0) > 0 ? `+${result.points}` : hunt ? 'Hunt complete' : '—'}
            </span>
          </div>
          {(result.points ?? 0) > 0 && (
            <p className="text-right text-[11px] font-black uppercase tracking-wide text-[#0B4F6C]/45">Aloha Points</p>
          )}
          {result.soft && result.detail && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#0B4F6C]/65">{result.detail}</p>
          )}

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
            const done = prog?.completed_stop_ids.length ?? 0;
            if (!hh) return null;
            return (
              <div key={p.huntId} className="mt-3 rounded-2xl bg-[#1FA9A3]/10 p-3">
                <div className="flex items-center gap-2.5">
                  <Icon name="Flag" className="h-4 w-4 text-[#0B6B67]" />
                  <span className="flex-1 text-[12.5px] font-extrabold text-[#062B3F]">{hh.name}: {done}/{req} Stops Completed</span>
                </div>
                <p className="mt-1 text-[11.5px] font-bold text-[#0B6B67]">
                  {req - done === 0 ? 'Hunt complete' : `Only ${req - done} more Stop${req - done === 1 ? '' : 's'} to finish this Hunt.`}
                </p>
              </div>
            );
          })}

          {elig.interactionReadyAt && (
            <div className="mt-3 rounded-2xl bg-[#062B3F] px-3 py-3 text-center text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">This Stop is cooling down</p>
              <CooldownClock until={elig.interactionReadyAt} prefix="Available again in " className="text-[20px] font-black text-[#E7C577]" />
            </div>
          )}

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
