export default function ScoreboardTime({ display, urgent = false, size = 'lg' }: { display: string; urgent?: boolean; size?: 'lg' | 'xl' }) {
  const chars = display.split('');
  const dims = size === 'xl' ? { w: 'w-16 sm:w-20', h: 'h-24 sm:h-28', text: 'text-5xl sm:text-6xl' } : { w: 'w-12 sm:w-14', h: 'h-16 sm:h-20', text: 'text-3xl sm:text-4xl' };
  return (
    <div className="flex items-center gap-1.5">
      {chars.map((ch, i) =>
        ch === ':' ? (
          <span key={i} className={`font-mono-num font-bold ${dims.text} ${urgent ? 'text-rose-400' : 'text-gold'}`}>:</span>
        ) : (
          <span
            key={i}
            className={`scoreboard-digit flex items-center justify-center font-mono-num font-bold ${dims.w} ${dims.h} ${dims.text} ${urgent ? 'text-rose-400' : 'text-gold'}`}
            style={urgent ? { borderColor: 'rgba(251,113,133,0.35)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.05), 0 0 16px rgba(251,113,133,0.25)' } : undefined}
          >
            {ch}
          </span>
        ),
      )}
    </div>
  );
}
