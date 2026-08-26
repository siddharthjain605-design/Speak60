import { useEffect, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { playScoreTick, playFanfare } from '../../lib/sound';
import Confetti from '../effects/Confetti';

interface Tier {
  min: number;
  label: string;
  color: string;
  glow: string;
}

const TIERS: Tier[] = [
  { min: 90, label: 'Outstanding', color: '#fbbf24', glow: 'rgba(251,191,36,0.35)' },
  { min: 75, label: 'Excellent', color: '#34d399', glow: 'rgba(52,211,153,0.3)' },
  { min: 60, label: 'Strong', color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  { min: 45, label: 'Developing', color: '#38bdf8', glow: 'rgba(56,189,248,0.3)' },
  { min: 0, label: 'Building Momentum', color: '#fb7185', glow: 'rgba(251,113,133,0.25)' },
];

function tierFor(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

export default function ScoreReveal({ score }: { score: number }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const animated = useCountUp(score, 1300, playScoreTick);
  const tier = tierFor(score);
  const pct = Math.min(100, Math.max(0, score));

  useEffect(() => {
    if (score >= 75) {
      const t = setTimeout(() => {
        setShowConfetti(true);
        playFanfare();
      }, 1300);
      return () => clearTimeout(t);
    }
  }, [score]);

  const circumference = 2 * Math.PI * 70;
  const offset = circumference * (1 - animated / 100);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-zinc-800 px-6 py-10 text-center"
      style={{ background: `radial-gradient(ellipse at 50% -10%, ${tier.glow}, transparent 65%), #0c0b12` }}
    >
      {showConfetti && <Confetti count={36} />}
      <div className="relative mx-auto flex flex-col items-center gap-3">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <svg width={160} height={160} className="-rotate-90">
            <circle cx={80} cy={80} r={70} stroke="#27272a" strokeWidth={10} fill="none" />
            <circle
              cx={80}
              cy={80}
              r={70}
              stroke={tier.color}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.15s linear', filter: `drop-shadow(0 0 8px ${tier.glow})` }}
            />
          </svg>
          <div className="animate-score-reveal absolute flex flex-col items-center">
            <span className="font-display font-mono-num text-6xl font-bold text-white">{animated}</span>
            <span className="text-xs uppercase tracking-widest text-zinc-500">/ 100</span>
          </div>
        </div>
        <div
          className="rounded-full px-4 py-1 text-sm font-bold uppercase tracking-wide"
          style={{ color: tier.color, backgroundColor: `${tier.color}1a`, border: `1px solid ${tier.color}44` }}
        >
          {tier.label}
        </div>
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})` }}
          />
        </div>
      </div>
    </div>
  );
}
