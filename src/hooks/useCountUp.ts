import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function useCountUp(target: number, durationMs = 1200, onTick?: () => void): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    let raf: number;
    startRef.current = null;
    lastTickRef.current = 0;

    const step = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const current = Math.round(easeOutCubic(progress) * target);
      setValue(current);
      if (onTick && current !== lastTickRef.current && current % 3 === 0) {
        lastTickRef.current = current;
        onTick();
      }
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
