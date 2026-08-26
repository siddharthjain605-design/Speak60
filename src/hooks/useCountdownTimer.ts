import { useCallback, useEffect, useRef, useState } from 'react';
import { playBeep, playUrgentBeep } from '../lib/sound';

interface UseCountdownTimerOptions {
  totalSeconds: number;
  onComplete: () => void;
  alertAtSeconds?: number[];
  autoStart?: boolean;
}

export function useCountdownTimer({ totalSeconds, onComplete, alertAtSeconds = [], autoStart = false }: UseCountdownTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(autoStart);
  const firedAlerts = useRef(new Set<number>());
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (alertAtSeconds.includes(next) && !firedAlerts.current.has(next)) {
          firedAlerts.current.add(next);
          if (next <= 10) playUrgentBeep();
          else playBeep();
        }
        if (next <= 0) {
          clearInterval(interval);
          setRunning(false);
          setTimeout(() => onCompleteRef.current(), 0);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, alertAtSeconds]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((newTotal?: number) => {
    firedAlerts.current.clear();
    setSecondsLeft(newTotal ?? totalSeconds);
    setRunning(false);
  }, [totalSeconds]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return { secondsLeft, running, start, pause, reset, display, progress: 1 - secondsLeft / totalSeconds };
}
