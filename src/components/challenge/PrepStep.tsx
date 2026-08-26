import { useEffect, useRef } from 'react';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { SecondaryButton } from '../ui';
import ScoreboardTime from '../effects/ScoreboardTime';
import type { Topic } from '../../types';

const PREP_SECONDS = 10 * 60;
const ALERTS = [300, 120, 60, 30, 10];

export default function PrepStep({
  topic,
  scratchpad,
  onScratchpadChange,
  onComplete,
}: {
  topic: Topic;
  scratchpad: string;
  onScratchpadChange: (v: string) => void;
  onComplete: () => void;
}) {
  const startedRef = useRef(false);
  const { secondsLeft, display, start, progress } = useCountdownTimer({
    totalSeconds: PREP_SECONDS,
    onComplete,
    alertAtSeconds: ALERTS,
  });

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [start]);

  const urgent = secondsLeft <= 30;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{topic.category}</div>
        <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">"{topic.text}"</h1>
      </div>

      <div className="stage flex flex-col items-center gap-4 rounded-3xl px-6 py-8">
        <ScoreboardTime display={display} urgent={urgent} size="xl" />
        <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/40">
          <div
            className={`h-full rounded-full ${urgent ? 'bg-rose-500' : 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)]'}`}
            style={{ width: `${progress * 100}%`, transition: 'width 1s linear' }}
          />
        </div>
        <p className="text-xs text-zinc-500">Preparation time — organise your thoughts before you speak.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Scratchpad — your own notes only
          </label>
          <textarea
            value={scratchpad}
            onChange={(e) => onScratchpadChange(e.target.value)}
            placeholder="Jot down whatever you already know. Nothing here is generated for you."
            className="h-56 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100 outline-none focus:border-violet-500"
          />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Think about</div>
          <ul className="mt-3 space-y-3 text-sm text-zinc-300">
            <li><span className="font-semibold text-violet-300">Opening</span> — one line stating your view</li>
            <li><span className="font-semibold text-violet-300">2-3 Key Points</span> — your main reasons</li>
            <li><span className="font-semibold text-violet-300">Example</span> — something concrete</li>
            <li><span className="font-semibold text-violet-300">Conclusion</span> — sum it up in one line</li>
          </ul>
          <p className="mt-4 text-xs text-zinc-500">This is a thinking prompt only — nothing is filled in for you.</p>
        </div>
      </div>

      <div className="flex justify-center">
        <SecondaryButton onClick={onComplete}>Finish preparation early</SecondaryButton>
      </div>
    </div>
  );
}
