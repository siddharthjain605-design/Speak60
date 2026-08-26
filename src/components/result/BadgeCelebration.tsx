import { useEffect, useState } from 'react';
import type { Badge } from '../../types';
import { playBadgeUnlock } from '../../lib/sound';
import Confetti from '../effects/Confetti';

export default function BadgeCelebration({ badges }: { badges: Badge[] }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (badges.length > 0) playBadgeUnlock();
  }, [badges]);

  if (badges.length === 0 || dismissed) return null;

  return (
    <div className="animate-badge-in relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 px-6 py-5">
      <Confetti count={20} />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400">🏆 Badge Unlocked</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b.id} className="font-display text-lg font-bold text-white">{b.name}</span>
            ))}
          </div>
          <p className="mt-1 text-sm text-zinc-400">{badges[0].description}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="shrink-0 text-zinc-500 hover:text-zinc-300">✕</button>
      </div>
    </div>
  );
}
