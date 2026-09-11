import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './kit';

/**
 * Original Aloha Hunt collect ritual — not a PokéStop spin.
 * Hold the puka (center stone) to charge a swell, then swipe the wave
 * across the Stop to open it. Designed as a branded, premium interaction.
 */
const AlohaCollect: React.FC<{
  stopName: string;
  disabled?: boolean;
  onCollected: () => void;
}> = ({ stopName, disabled, onCollected }) => {
  const [charge, setCharge] = useState(0);
  const [phase, setPhase] = useState<'hold' | 'swipe' | 'opening'>('hold');
  const [swipe, setSwipe] = useState(0);
  const holding = useRef(false);
  const dragging = useRef(false);
  const raf = useRef(0);
  const startX = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tick = useCallback((start: number) => {
    const step = (now: number) => {
      if (!holding.current) return;
      const pct = Math.min(100, ((now - start) / 1100) * 100);
      setCharge(pct);
      if (pct >= 100) {
        holding.current = false;
        setPhase('swipe');
        if (navigator.vibrate) navigator.vibrate(18);
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  const onHoldStart = (e: React.PointerEvent) => {
    if (disabled || phase !== 'hold') return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    holding.current = true;
    setCharge(0);
    tick(performance.now());
  };

  const onHoldEnd = () => {
    if (phase !== 'hold') return;
    holding.current = false;
    cancelAnimationFrame(raf.current);
    setCharge((c) => (c >= 100 ? 100 : 0));
  };

  const onSwipeStart = (e: React.PointerEvent) => {
    if (disabled || phase !== 'swipe') return;
    startX.current = e.clientX;
    dragging.current = true;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* not required */ }
  };

  const onSwipeMove = (e: React.PointerEvent) => {
    if (disabled || phase !== 'swipe' || !dragging.current) return;
    const width = trackRef.current?.clientWidth ?? 280;
    const dx = e.clientX - startX.current;
    setSwipe(Math.max(0, Math.min(100, (dx / (width * 0.72)) * 100)));
  };

  const onSwipeEnd = () => {
    if (phase !== 'swipe') return;
    dragging.current = false;
    setSwipe((current) => {
      if (current >= 78) {
        setPhase('opening');
        if (navigator.vibrate) navigator.vibrate([12, 30, 18]);
        window.setTimeout(onCollected, 420);
        return 100;
      }
      return 0;
    });
  };

  return (
    <div className={cn('select-none px-1 py-1', disabled && 'pointer-events-none opacity-45')}>
      <div className="relative mx-auto flex h-[220px] w-[220px] items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border border-[#1FA9A3]/35"
            style={{ animation: `ah-swell 2.4s ease-out ${i * 0.55}s infinite` }}
          />
        ))}
        <span
          className="absolute inset-3 rounded-full"
          style={{
            background: `conic-gradient(#E7C577 ${charge * 3.6}deg, rgba(255,255,255,.18) 0deg)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))',
          }}
        />
        <button
          type="button"
          disabled={disabled || phase !== 'hold'}
          onPointerDown={onHoldStart}
          onPointerUp={onHoldEnd}
          onPointerCancel={onHoldEnd}
          className={cn(
            'relative z-10 flex h-[118px] w-[118px] flex-col items-center justify-center rounded-full text-white shadow-[0_18px_40px_-12px_rgba(11,79,108,.9)]',
            'bg-gradient-to-br from-[#1FA9A3] via-[#0B4F6C] to-[#062B3F]',
            phase === 'hold' && 'active:scale-95',
          )}
          style={{ touchAction: 'none' }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
            {phase === 'hold' ? 'Hold' : phase === 'swipe' ? 'Open' : 'Aloha'}
          </span>
          <span className="mt-0.5 text-[15px] font-black tracking-wide">
            {phase === 'opening' ? 'Collected' : 'Puka'}
          </span>
        </button>
      </div>

      <p className="mt-1 text-center text-[12.5px] font-bold text-[#0B4F6C]/70">
        {phase === 'hold' && 'Hold the puka to charge the swell'}
        {phase === 'swipe' && `Swipe the wave across ${stopName}`}
        {phase === 'opening' && 'Opening this Aloha Stop…'}
      </p>

      <div
        ref={trackRef}
        role="slider"
        aria-label="Swipe the wave to collect"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(swipe)}
        className={cn(
          'relative mt-3 h-14 overflow-hidden rounded-full bg-[#0B4F6C]/8 ring-1 ring-black/5',
          phase === 'hold' && 'opacity-40',
        )}
        onPointerDown={onSwipeStart}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeEnd}
        onPointerCancel={() => { dragging.current = false; setSwipe(0); }}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1FA9A3]/30 via-[#E7C577]/50 to-[#FF9E4A]/40"
          style={{ width: `${Math.max(18, swipe)}%` }}
        />
        <div
          className="absolute top-1 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] text-white shadow-lg transition-[left] duration-75"
          style={{ left: `calc(${Math.min(swipe, 100)}% - ${swipe > 8 ? 24 : 4}px)` }}
        >
          <Icon name="Waves" className="h-5 w-5" />
        </div>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-black uppercase tracking-[0.18em] text-[#0B4F6C]/45">
          {phase === 'swipe' ? 'Swipe to collect' : 'Wave locked'}
        </span>
      </div>
    </div>
  );
};

export default AlohaCollect;
