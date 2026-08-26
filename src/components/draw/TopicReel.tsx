import { useEffect, useRef, useState } from 'react';
import type { Topic } from '../../types';
import { playFanfare, playReelTick, playSparkle, startRumble } from '../../lib/sound';
import Confetti from '../effects/Confetti';

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

function MarqueeLights({ active }: { active: boolean }) {
  const count = 24;
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        return (
          <span
            key={i}
            className="marquee-dot absolute h-1.5 w-1.5 rounded-full"
            style={{
              background: active ? '#facc15' : '#3f3f46',
              top: `calc(50% - 0.75px + ${48 * Math.sin((angle * Math.PI) / 180)}%)`,
              left: `calc(50% - 0.75px + ${49.5 * Math.cos((angle * Math.PI) / 180)}%)`,
              animationDelay: `${(i / count) * 1.4}s`,
              boxShadow: active ? '0 0 6px 1px #facc15' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export default function TopicReel({ pool, finalTopic, onLocked }: TopicReelProps) {
  const [spinning, setSpinning] = useState(true);
  const [displayed, setDisplayed] = useState<Topic>(pool[0] ?? finalTopic);
  const [locked, setLocked] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const stopRumbleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopRumbleRef.current = startRumble();
    let elapsed = 0;
    const totalDuration = 3800;
    let delay = 55;

    const tick = () => {
      elapsed += delay;
      if (elapsed >= totalDuration) {
        setDisplayed(finalTopic);
        setSpinning(false);
        setLocked(true);
        stopRumbleRef.current?.();
        playFanfare();
        setTimeout(playSparkle, 120);
        setTimeout(onLocked, 1100);
        return;
      }
      const random = pool[Math.floor(Math.random() * pool.length)];
      setDisplayed(random ?? finalTopic);
      const progress = elapsed / totalDuration;
      playReelTick(progress);
      delay = 55 + progress * progress * 300;
      timeoutRef.current = window.setTimeout(tick, delay);
    };

    timeoutRef.current = window.setTimeout(tick, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopRumbleRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glow = DIFFICULTY_GLOW[displayed.difficulty] ?? '#a78bfa';

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative">
        {!spinning && (
          <div
            className="spotlight-sweep pointer-events-none absolute -inset-16 rounded-full opacity-40 blur-3xl"
            style={{ background: `conic-gradient(from 0deg, transparent, ${glow}55, transparent 60%)` }}
          />
        )}
        <div
          className={`relative w-full max-w-xl overflow-hidden rounded-2xl border-2 px-6 py-12 text-center shadow-2xl shadow-black/60 transition-colors duration-500 ${
            locked ? 'animate-flash-lock border-amber-400' : 'border-zinc-700'
          }`}
          style={{
            background: 'radial-gradient(ellipse at center, #17151f 0%, #060509 100%)',
            boxShadow: locked ? `0 0 60px 4px ${glow}66, 0 25px 50px -12px rgba(0,0,0,0.8)` : undefined,
          }}
        >
          <MarqueeLights active={locked} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black to-transparent" />

          <div className="relative mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-400/80">
            {spinning ? 'Spinning…' : '🔒 Locked In'}
          </div>
          <div
            className={`relative text-sm font-semibold uppercase tracking-wide transition-opacity ${spinning ? 'opacity-60 text-zinc-500' : ''}`}
            style={!spinning ? { color: glow } : undefined}
          >
            {displayed.category}
          </div>
          <div className={`font-display relative mt-4 min-h-[5rem] text-2xl font-bold text-white sm:text-3xl ${locked ? 'animate-jackpot-pop' : ''}`}>
            {displayed.text}
          </div>

          {locked && <Confetti />}
        </div>
      </div>
      {!spinning && (
        <div className="animate-pulse-glow rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-amber-300">
          ✨ Today's topic is set
        </div>
      )}
    </div>
  );
}
