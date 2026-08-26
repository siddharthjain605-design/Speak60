import { useEffect, useRef, useState } from 'react';
import type { Topic } from '../../types';
import { playLockIn, playReelTick } from '../../lib/sound';

interface TopicReelProps {
  pool: Topic[];
  finalTopic: Topic;
  onLocked: () => void;
}

export default function TopicReel({ pool, finalTopic, onLocked }: TopicReelProps) {
  const [spinning, setSpinning] = useState(true);
  const [displayed, setDisplayed] = useState<Topic>(pool[0] ?? finalTopic);
  const [locked, setLocked] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let elapsed = 0;
    const totalDuration = 3200;
    let delay = 55;

    const tick = () => {
      elapsed += delay;
      if (elapsed >= totalDuration) {
        setDisplayed(finalTopic);
        setSpinning(false);
        setLocked(true);
        playLockIn();
        setTimeout(onLocked, 700);
        return;
      }
      const random = pool[Math.floor(Math.random() * pool.length)];
      setDisplayed(random ?? finalTopic);
      playReelTick();
      const progress = elapsed / totalDuration;
      delay = 55 + progress * progress * 260;
      timeoutRef.current = window.setTimeout(tick, delay);
    };

    timeoutRef.current = window.setTimeout(tick, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={`relative w-full max-w-xl overflow-hidden rounded-2xl border-2 ${
          locked ? 'border-amber-400 animate-flash-lock' : 'border-zinc-700'
        } bg-gradient-to-b from-zinc-900 to-black px-6 py-10 text-center shadow-2xl shadow-black/60`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent" />
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400/80">
          {spinning ? 'Spinning…' : 'Locked In'}
        </div>
        <div className={`text-sm font-medium uppercase tracking-wide text-zinc-500 ${spinning ? 'opacity-70' : ''}`}>
          {displayed.category}
        </div>
        <div className="mt-3 min-h-[4.5rem] text-xl font-bold text-white sm:text-2xl">
          {displayed.text}
        </div>
      </div>
      {!spinning && (
        <div className="animate-pulse-glow rounded-full bg-zinc-900 px-4 py-1 text-xs text-amber-300">
          Today's topic is set
        </div>
      )}
    </div>
  );
}
