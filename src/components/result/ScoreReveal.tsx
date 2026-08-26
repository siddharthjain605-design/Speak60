import { useEffect, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { playScoreTick, playCrashSting, playDrumroll } from '../../lib/sound';
import Confetti from '../effects/Confetti';
import Shockwave from '../effects/Shockwave';

interface Tier {
  min: number;
  label: string;
  icon: string;
  color: string;
  glow: string;
}

const TIERS: Tier[] = [
  { min: 90, label: 'Outstanding', icon: '🏆', color: '#f4c542', glow: 'rgba(244,197,66,0.4)' },
  { min: 75, label: 'Excellent', icon: '🥇', color: '#34d399', glow: 'rgba(52,211,153,0.32)' },
  { min: 60, label: 'Strong', icon: '🥈', color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  { min: 45, label: 'Developing', icon: '🥉', color: '#38bdf8', glow: 'rgba(56,189,248,0.3)' },
  { min: 0, label: 'Building Momentum', icon: '🎯', color: '#fb7185', glow: 'rgba(251,113,133,0.25)' },
];

function tierFor(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

export default function ScoreReveal({ score }: { score: number }) {
  const [phase, setPhase] = useState<'suspense' | 'revealing' | 'done'>('suspense');
  const animated = useCountUp(phase !== 'suspense' ? score : 0, 1300, playScoreTick);
  const tier = tierFor(score);
  const pct = Math.min(100, Math.max(0, score));

  useEffect(() => {
    playDrumroll(900);
    const t1 = setTimeout(() => {
      playCrashSting();
      setPhase('revealing');
    }, 950);
    const t2 = setTimeout(() => setPhase('done'), 950 + 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [score]);

  const circumference = 2 * Math.PI * 70;
  const offset = circumference * (1 - animated / 100);

  return (
    <div className="stage relative overflow-hidden rounded-3xl border border-[var(--gold-deep)]/40 px-6 py-12 text-center">
      {phase === 'revealing' && score >= 60 && <Confetti count={40} />}
      <div className="relative mx-auto flex flex-col items-center gap-4">
        {phase === 'suspense' ? (
          <div className="flex h-44 w-44 flex-col items-center justify-center gap-3">
            <div className="animate-drumroll text-6xl">🥁</div>
            <div className="font-display text-xs font-bold uppercase tracking-[0.3em] text-gold">Tallying your score…</div>
          </div>
        ) : (
          <div className="relative flex h-44 w-44 items-center justify-center">
            {phase === 'revealing' && <Shockwave color={tier.color} />}
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
                style={{ transition: 'stroke-dashoffset 0.15s linear', filter: `drop-shadow(0 0 10px ${tier.glow})` }}
              />
            </svg>
            <div className="animate-score-reveal absolute flex flex-col items-center">
              <span className="font-display font-mono-num text-6xl font-bold text-white">{animated}</span>
              <span className="text-xs uppercase tracking-widest text-zinc-500">/ 100</span>
            </div>
          </div>
        )}

        {phase !== 'suspense' && (
          <>
            <div
              className="animate-badge-in flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-bold uppercase tracking-wide"
              style={{ color: tier.color, backgroundColor: `${tier.color}1a`, border: `1px solid ${tier.color}55` }}
            >
              <span className="text-lg">{tier.icon}</span> {tier.label}
            </div>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
