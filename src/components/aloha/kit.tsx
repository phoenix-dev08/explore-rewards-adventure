import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';


// ---------------------------------------------------------------------------
// Aloha Hunt design system primitives
// ---------------------------------------------------------------------------

export const C = {
  deep: '#062B3F',
  ocean: '#0B4F6C',
  aqua: '#1FA9A3',
  coral: '#FF6F59',
  sunrise: '#FF9E4A',
  sand: '#FBF7F0',
  green: '#2F855A',
  gold: '#D4A853',
};

export const Icon: React.FC<{ name: string; className?: string; strokeWidth?: number }> = ({ name, className, strokeWidth = 2 }) => {
  const Cmp = (Icons as unknown as Record<string, React.FC<{ className?: string; strokeWidth?: number }>>)[name] ?? Icons.MapPin;
  return <Cmp className={className} strokeWidth={strokeWidth} />;
};

/** Original Aloha Hunt mark: a location pin fused with a sunrise + wave. */
export const AlohaMark: React.FC<{ size?: number; className?: string; mono?: boolean }> = ({ size = 40, className, mono }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
    <defs>
      <linearGradient id="ahp" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={mono ? '#fff' : C.aqua} />
        <stop offset="100%" stopColor={mono ? '#fff' : C.ocean} />
      </linearGradient>
      <linearGradient id="ahs" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={mono ? '#fff' : C.sunrise} />
        <stop offset="100%" stopColor={mono ? '#fff' : C.coral} />
      </linearGradient>
    </defs>
    <path d="M24 3c8.8 0 16 7.1 16 15.9C40 30.2 27.6 41.8 24.9 44.4a1.3 1.3 0 0 1-1.8 0C20.4 41.8 8 30.2 8 18.9 8 10.1 15.2 3 24 3Z" fill="url(#ahp)" />
    <path d="M24 9.5a9.6 9.6 0 0 1 9.6 9.6H14.4A9.6 9.6 0 0 1 24 9.5Z" fill="url(#ahs)" opacity={mono ? 0.55 : 1} />
    <path d="M13.6 23.6c2 0 2.6 1.7 5.2 1.7s3.2-1.7 5.2-1.7 2.6 1.7 5.2 1.7 3.2-1.7 5.2-1.7" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" fill="none" />
    <path d="M13.6 29.2c2 0 2.6 1.7 5.2 1.7s3.2-1.7 5.2-1.7 2.6 1.7 5.2 1.7 3.2-1.7 5.2-1.7" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" fill="none" opacity=".62" />
  </svg>
);

export const Wordmark: React.FC<{ className?: string; light?: boolean; size?: 'sm' | 'md' | 'lg'; tagline?: boolean }> = ({ className, light, size = 'md', tagline }) => {
  const s = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <AlohaMark size={size === 'lg' ? 46 : size === 'sm' ? 26 : 34} mono={light} />
      <div className="leading-none">
        <div className={cn('font-black tracking-[0.16em]', s, light ? 'text-white' : 'text-[#062B3F]')}>
          ALOHA<span className={light ? 'text-white/70' : 'text-[#1FA9A3]'}>HUNT</span>
        </div>
        {tagline && (
          <div className={cn('mt-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]', light ? 'text-white/70' : 'text-[#0B4F6C]/60')}>
            Explore. Hunt. Get rewarded.
          </div>
        )}
      </div>
    </div>
  );
};

export const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode; icon?: string; tone?: 'default' | 'gold' | 'coral' }> = ({ active, onClick, children, icon, tone = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 active:scale-95',
      active
        ? tone === 'gold'
          ? 'border-[#D4A853] bg-[#D4A853] text-[#3A2A05] shadow-[0_6px_18px_-6px_rgba(212,168,83,.8)]'
          : tone === 'coral'
            ? 'border-[#FF6F59] bg-[#FF6F59] text-white shadow-[0_6px_18px_-6px_rgba(255,111,89,.9)]'
            : 'border-[#0B4F6C] bg-[#0B4F6C] text-white shadow-[0_6px_18px_-8px_rgba(11,79,108,.9)]'
        : 'border-black/8 bg-white/90 text-[#0B4F6C] hover:border-[#1FA9A3]/50 hover:bg-white',
    )}
  >
    {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
    {children}
  </button>
);

export const Pill: React.FC<{ children: React.ReactNode; tone?: 'aqua' | 'coral' | 'gold' | 'slate' | 'green' | 'dark'; className?: string; icon?: string }> = ({ children, tone = 'slate', className, icon }) => {
  const tones = {
    aqua: 'bg-[#1FA9A3]/12 text-[#0B6B67] ring-[#1FA9A3]/25',
    coral: 'bg-[#FF6F59]/12 text-[#B23D2A] ring-[#FF6F59]/25',
    gold: 'bg-[#D4A853]/16 text-[#8A6414] ring-[#D4A853]/30',
    green: 'bg-[#2F855A]/12 text-[#22633F] ring-[#2F855A]/25',
    slate: 'bg-[#0B4F6C]/8 text-[#0B4F6C] ring-[#0B4F6C]/15',
    dark: 'bg-[#062B3F] text-white ring-white/10',
  }[tone];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1', tones, className)}>
      {icon && <Icon name={icon} className="h-3 w-3" />}
      {children}
    </span>
  );
};

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'coral' | 'gold' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  full?: boolean;
}> = ({ variant = 'primary', size = 'md', icon, full, className, children, ...rest }) => {
  const variants = {
    primary: 'bg-gradient-to-br from-[#0B4F6C] to-[#062B3F] text-white shadow-[0_12px_28px_-14px_rgba(6,43,63,.85)] hover:brightness-110',
    coral: 'bg-gradient-to-br from-[#FF9E4A] to-[#FF6F59] text-white shadow-[0_12px_28px_-12px_rgba(255,111,89,.8)] hover:brightness-105',
    secondary: 'bg-[#1FA9A3] text-white shadow-[0_10px_24px_-14px_rgba(31,169,163,.9)] hover:brightness-105',
    gold: 'bg-gradient-to-br from-[#E7C577] to-[#D4A853] text-[#3A2A05] shadow-[0_12px_28px_-14px_rgba(212,168,83,.9)]',
    outline: 'border border-[#0B4F6C]/20 bg-white text-[#0B4F6C] hover:border-[#0B4F6C]/40 hover:bg-[#0B4F6C]/[.03]',
    ghost: 'text-[#0B4F6C] hover:bg-[#0B4F6C]/6',
  }[variant];
  const sizes = { sm: 'px-3.5 py-2 text-[13px] rounded-xl', md: 'px-5 py-3 text-sm rounded-2xl', lg: 'px-6 py-4 text-[15px] rounded-2xl' }[size];
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        variants, sizes, full && 'w-full', className,
      )}
    >
      {icon && <Icon name={icon} className={size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />}
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { pad?: boolean }> = ({ className, pad, children, ...rest }) => (
  <div {...rest} className={cn('rounded-3xl border border-black/5 bg-white shadow-[0_2px_10px_-4px_rgba(6,43,63,.1),0_18px_40px_-32px_rgba(6,43,63,.35)]', pad && 'p-5', className)}>
    {children}
  </div>
);

export const SectionTitle: React.FC<{ title: string; action?: string; onAction?: () => void; sub?: string; className?: string }> = ({ title, action, onAction, sub, className }) => (
  <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
    <div>
      <h3 className="text-[17px] font-extrabold tracking-tight text-[#062B3F]">{title}</h3>
      {sub && <p className="mt-0.5 text-[12.5px] text-[#0B4F6C]/60">{sub}</p>}
    </div>
    {action && (
      <button onClick={onAction} className="shrink-0 text-[12.5px] font-bold text-[#1FA9A3] hover:underline">{action}</button>
    )}
  </div>
);

export const ProgressRing: React.FC<{ value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode; track?: string }> = ({ value, size = 68, stroke = 6, color = C.aqua, children, track = 'rgba(11,79,108,.12)' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setAnim(value), 60);
    return () => window.clearTimeout(t);
  }, [value]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (circ * Math.min(100, anim)) / 100}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

export const Bar: React.FC<{ value: number; className?: string; color?: string }> = ({ value, className, color = C.aqua }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = window.setTimeout(() => setW(value), 80); return () => window.clearTimeout(t); }, [value]);
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[#0B4F6C]/10', className)}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, w)}%`, background: color, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  );
};

/** Animated point counter — ticks to the new value whenever the balance moves. */
export const Points: React.FC<{ value: number; className?: string; duration?: number }> = ({ value, className, duration = 900 }) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{display.toLocaleString()}</span>;
};

/** Bottom sheet with premium spring-in transition. Portals into the app shell
 *  overlay layer so it always covers the visible app column, never the page. */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode; full?: boolean; label?: string }> = ({ open, onClose, children, full, label }) => {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => { setHost(document.getElementById('aloha-overlay')); }, [open]);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = window.setTimeout(() => setShown(true), 20);
      return () => window.clearTimeout(t);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(t);
  }, [open]);
  if (!mounted) return null;
  const node = (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-end" role="dialog" aria-label={label}>
      <button
        aria-label="Close"
        onClick={onClose}
        className={cn('absolute inset-0 bg-[#031A27]/55 backdrop-blur-[2px] transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
      />
      <div
        className={cn(
          'relative flex w-full flex-col overflow-hidden shadow-[0_-20px_60px_-20px_rgba(3,26,39,.6)] transition-transform duration-300',
          full ? 'h-full rounded-none bg-[#031A27]' : 'max-h-[88%] rounded-t-[28px] bg-[#FBF7F0]',
        )}
        style={{ transform: shown ? 'translateY(0)' : 'translateY(102%)', transitionTimingFunction: 'cubic-bezier(.22,1,.36,1)' }}
      >
        {!full && <div className="flex shrink-0 justify-center pt-3"><div className="h-1.5 w-10 rounded-full bg-[#0B4F6C]/18" /></div>}
        <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', full ? 'pb-0' : 'pb-6')}>{children}</div>
      </div>
    </div>
  );
  return host ? createPortal(node, host) : node;
};


export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-2xl bg-[#0B4F6C]/8', className)} />
);

export const EmptyState: React.FC<{ icon?: string; title: string; body?: string; action?: React.ReactNode }> = ({ icon = 'Compass', title, body, action }) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#0B4F6C]/15 bg-white/70 px-6 py-12 text-center">
    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1FA9A3]/10">
      <Icon name={icon} className="h-7 w-7 text-[#1FA9A3]" />
    </div>
    <h4 className="text-[15px] font-extrabold text-[#062B3F]">{title}</h4>
    {body && <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-[#0B4F6C]/65">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const HeaderBar: React.FC<{ title?: string; onBack?: () => void; right?: React.ReactNode; transparent?: boolean; subtitle?: string }> = ({ title, onBack, right, transparent, subtitle }) => (
  <div className={cn('sticky top-0 z-30 flex items-center gap-3 px-4 py-3', transparent ? '' : 'border-b border-black/5 bg-[#FBF7F0]/92 backdrop-blur-xl')}>
    {onBack && (
      <button
        onClick={onBack}
        aria-label="Back"
        className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-90',
          transparent ? 'bg-white/85 text-[#062B3F] shadow-lg backdrop-blur' : 'bg-white text-[#062B3F] shadow-sm ring-1 ring-black/5')}
      >
        <Icon name="ChevronLeft" className="h-5 w-5" />
      </button>
    )}
    {title && (
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[17px] font-extrabold tracking-tight text-[#062B3F]">{title}</h2>
        {subtitle && <p className="truncate text-[12px] text-[#0B4F6C]/60">{subtitle}</p>}
      </div>
    )}
    {!title && <div className="flex-1" />}
    {right}
  </div>
);

export const Countdown: React.FC<{ to: string; className?: string; prefix?: string }> = ({ to, className, prefix }) => {
  const [, force] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  const ms = new Date(to).getTime() - Date.now();
  if (ms <= 0) return <span className={className}>Ended</span>;
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {prefix}{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
};

/** Interaction cooldown clock — “Available again in 14:59” */
export const CooldownClock: React.FC<{ until: Date | string | null; prefix?: string; className?: string; endedLabel?: string }> = ({
  until, prefix = 'Available again in ', className, endedLabel = 'Available now',
}) => {
  const [, force] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 250);
    return () => window.clearInterval(t);
  }, []);
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return <span className={className}>{endedLabel}</span>;
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const clock = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {prefix}{clock}
    </span>
  );
};

export const StatTile: React.FC<{ label: string; value: React.ReactNode; icon: string; tone?: string }> = ({ label, value, icon, tone = C.aqua }) => (
  <div className="rounded-2xl border border-black/5 bg-white p-3.5 shadow-[0_10px_26px_-24px_rgba(6,43,63,.6)]">
    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${tone}1A` }}>
      <Icon name={icon} className="h-4 w-4" style={{ color: tone } as React.CSSProperties} />
    </div>
    <div className="text-[18px] font-black leading-none text-[#062B3F]">{value}</div>
    <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#0B4F6C]/55">{label}</div>
  </div>
);
