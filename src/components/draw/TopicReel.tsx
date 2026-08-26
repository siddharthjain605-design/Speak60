import { useEffect, useRef, useState } from 'react';
import type { Topic } from '../../types';
import { playCrashSting, playDrumroll, playReelTick, startRumble } from '../../lib/sound';
import Confetti from '../effects/Confetti';
import Shockwave from '../effects/Shockwave';

interface TopicReelProps {
  pool: Topic[];
  finalTopic: Topic;
  onLocked: () => void;
}

const DIFFICULTY_GLOW: Record<number, string> = {
  1: '#34d399',
  2: '#38bdf8',
  3: '#a78bfa',
  4: '#fb923c',
  5: '#f472b6',
};

type Phase = 'spin' | 'suspense' | 'reveal';

function MarqueeLights({ active }: { active: boolean }) {
  const count = 28;
  return (
    <div className="pointer-events-none absolute inset-0 rounded-3xl">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        return (
          <span
            key={i}
            className="marquee-dot absolute h-2 w-2 rounded-full"
            style={{
              background: active ? 'var(--gold-bright)' : '#4b3a12',
              top: `calc(50% - 1px + ${48.5 * Math.sin((angle * Math.PI) / 180)}%)`,
              left: `calc(50% - 1px + ${49.5 * Math.cos((angle * Math.PI) / 180)}%)`,
              animationDelay: `${(i / count) * 1.4}s`,
              boxShadow: active ? '0 0 8px 2px var(--gold)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export default function TopicReel({ pool, finalTopic, onLocked }: TopicReelProps) {
  const [phase, setPhase] = useState<Phase>('spin');
  const [displayed, setDisplayed] = useState<Topic>(pool[0] ?? finalTopic);
  const timeoutRef = useRef<number | null>(null);
  const stopRumbleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopRumbleRef.current = startRumble();
    let elapsed = 0;
    const spinDuration = 3200;
    let delay = 50;

    const tick = () => {
      elapsed += delay;
      if (elapsed >= spinDuration) {
        stopRumbleRef.current?.();
        setPhase('suspense');
        playDrumroll(1100);
        timeoutRef.current = window.setTimeout(() => {
          setDisplayed(finalTopic);
          setPhase('reveal');
          playCrashSting();
          timeoutRef.current = window.setTimeout(onLocked, 1500);
        }, 1150);
        return;
      }
      const random = pool[Math.floor(Math.random() * pool.length)];
      setDisplayed(random ?? finalTopic);
      const progress = elapsed / spinDuration;
      playReelTick(progress);
      delay = 50 + progress * progress * 260;
      timeoutRef.current = window.setTimeout(tick, delay);
    };

    timeoutRef.current = window.setTimeout(tick, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopRumbleRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locked = phase === 'reveal';
  const glow = locked ? (DIFFICULTY_GLOW[displayed.difficulty] ?? '#a78bfa') : 'var(--gold)';

  return (
    <div className="stage -mx-4 flex flex-col items-center gap-6 rounded-3xl px-4 py-10 sm:-mx-6 sm:px-6">
      <div className="relative">
        <div
          className="spotlight-sweep pointer-events-none absolute -inset-20 rounded-full opacity-50 blur-3xl"
          style={{ background: `conic-gradient(from 0deg, transparent, ${glow}55, transparent 60%)` }}
        />
        <div
          className={`relative w-full max-w-xl overflow-hidden rounded-3xl border-[3px] px-6 py-14 text-center transition-colors duration-500 ${
            locked ? 'animate-flash-lock' : ''
          }`}
          style={{
            borderColor: locked ? glow : 'var(--gold-deep)',
            background: 'radial-gradient(ellipse at 50% 0%, #201808 0%, #08070c 65%)',
            boxShadow: `0 0 70px 6px ${glow}44, inset 0 0 40px rgba(0,0,0,0.6), 0 30px 60px -15px rgba(0,0,0,0.9)`,
          }}
        >
          <MarqueeLights active={phase !== 'spin'} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 to-transparent" />

          <div className={`relative mb-4 font-display text-xs font-bold uppercase tracking-[0.4em] ${phase === 'suspense' ? 'animate-drumroll text-gold' : 'text-gold/80'}`}>
            {phase === 'spin' && 'Spinning…'}
            {phase === 'suspense' && 'Locking your topic…'}
            {phase === 'reveal' && '🔒 Locked In'}
          </div>

          {phase === 'suspense' ? (
            <div className="relative flex min-h-[7rem] flex-col items-center justify-center gap-3">
              <div className="animate-drumroll text-6xl">🔒</div>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-black/40">
                <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
              </div>
            </div>
          ) : (
            <>
              <div
                className={`relative text-sm font-semibold uppercase tracking-wide transition-opacity ${phase === 'spin' ? 'opacity-50 text-zinc-500' : ''}`}
                style={locked ? { color: glow } : undefined}
              >
                {displayed.category}
              </div>
              <div className={`font-display relative mt-4 min-h-[5rem] text-2xl font-bold text-white sm:text-3xl ${locked ? 'animate-jackpot-pop' : ''}`}>
                {displayed.text}
              </div>
            </>
          )}

          {locked && (
            <>
              <Shockwave color={glow} />
              <Confetti />
            </>
          )}
        </div>
      </div>
      {locked && (
        <div className="animate-pulse-glow rounded-full bg-black/40 px-4 py-1.5 text-xs font-medium text-gold">
          ✨ Today's topic is set
        </div>
      )}
    </div>
  );
}
