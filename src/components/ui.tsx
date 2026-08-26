import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-sm ${className}`}
      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 20px 40px -20px rgba(0,0,0,0.6)' }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-400">{children}</h2>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export function StatTile({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: string; tone?: 'default' | 'good' | 'bad' | 'accent' }) {
  const toneClass = {
    default: 'text-zinc-100',
    good: 'text-emerald-400',
    bad: 'text-rose-400',
    accent: 'text-violet-400',
  }[tone];
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 font-mono-num text-2xl font-semibold ${toneClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'good' | 'bad' | 'warn' }) {
  const toneClass = {
    default: 'bg-zinc-800 text-zinc-300',
    accent: 'bg-violet-500/15 text-violet-300',
    good: 'bg-emerald-500/15 text-emerald-300',
    bad: 'bg-rose-500/15 text-rose-300',
    warn: 'bg-amber-500/15 text-amber-300',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>{children}</span>;
}

export function ScoreGauge({ value, max = 100, size = 120, label }: { value: number; max?: number; size?: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const color = pct >= 0.8 ? '#34d399' : pct >= 0.6 ? '#a78bfa' : pct >= 0.4 ? '#fbbf24' : '#fb7185';
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#27272a" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono-num text-2xl font-bold text-white">{Math.round(value)}</span>
        {label && <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = 'accent' }: { value: number; max?: number; tone?: 'accent' | 'good' | 'bad' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = { accent: 'bg-violet-500', good: 'bg-emerald-500', bad: 'bg-rose-500' }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-display rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/40 transition-all duration-150 hover:-translate-y-0.5 hover:from-violet-400 hover:to-violet-500 hover:shadow-violet-800/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, className = '' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-medium text-zinc-200 transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}
