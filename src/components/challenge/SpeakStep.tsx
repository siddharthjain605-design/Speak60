import { useEffect, useRef, useState } from 'react';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { playGo, playCountdownTick } from '../../lib/sound';
import { PrimaryButton } from '../ui';
import type { Topic, TranscriptSegment } from '../../types';

const SPEAK_SECONDS = 60;

type Phase = 'ready' | 'countdown' | 'recording' | 'finishing';

export interface SpeakResult {
  blob: Blob | null;
  transcript: string;
  segments: TranscriptSegment[];
  durationSec: number;
  micError: string | null;
}

export default function SpeakStep({ topic, onComplete }: { topic: Topic; onComplete: (result: SpeakResult) => void }) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [micError, setMicError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechStartRef = useRef(0);
  const speech = useSpeechRecognition();

  const finishRecording = async () => {
    setPhase('finishing');
    speech.stop();
    const durationSec = (performance.now() - speechStartRef.current) / 1000;
    const recorder = recorderRef.current;
    let blob: Blob | null = null;
    if (recorder && recorder.state !== 'inactive') {
      blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
        recorder.stop();
      });
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onComplete({
      blob,
      transcript: speech.finalText.trim(),
      segments: speech.segments,
      durationSec: Math.min(durationSec, SPEAK_SECONDS + 2),
      micError,
    });
  };

  const { display, start: startSpeakTimer } = useCountdownTimer({
    totalSeconds: SPEAK_SECONDS,
    onComplete: finishRecording,
    alertAtSeconds: [10],
  });

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) return;
    playCountdownTick();
    const t = setTimeout(() => {
      if (countdownNum === 1) {
        playGo();
        beginRecording();
      } else {
        setCountdownNum((n) => n - 1);
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdownNum]);

  async function requestMicAndCountdown() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPhase('countdown');
      setCountdownNum(3);
    } catch {
      setMicError('Microphone access was denied or unavailable. Please allow microphone access to continue.');
    }
  }

  function beginRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorderRef.current = recorder;
    recorder.start();
    speechStartRef.current = performance.now();
    speech.start();
    setPhase('recording');
    startSpeakTimer();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">{topic.category}</div>
        <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">"{topic.text}"</h1>
      </div>

      {phase === 'ready' && (
        <div className="flex flex-col items-center gap-4">
          <PrimaryButton onClick={requestMicAndCountdown} className="px-10 py-6 text-2xl">
            🎙 START SPEAKING
          </PrimaryButton>
          {!speech.supported && (
            <p className="max-w-md text-xs text-amber-400">
              Live transcription isn't supported in this browser. Your audio will still be recorded — for
              best results use a Chromium-based browser (Chrome/Edge).
            </p>
          )}
          {micError && <p className="max-w-md text-sm text-rose-400">{micError}</p>}
        </div>
      )}

      {phase === 'countdown' && (
        <div className="font-mono-num text-8xl font-extrabold text-violet-300">{countdownNum}</div>
      )}

      {phase === 'recording' && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-rose-400">
            <span className="h-3 w-3 animate-pulse rounded-full bg-rose-500" />
            <span className="text-sm font-semibold uppercase tracking-wide">Recording</span>
          </div>
          <div className="font-mono-num text-7xl font-extrabold tabular-nums text-white sm:text-8xl">{display}</div>
          <p className="text-xs text-zinc-500">Speak naturally. Recording stops automatically at 00:00.</p>
        </div>
      )}

      {phase === 'finishing' && (
        <div className="text-lg text-zinc-400">Wrapping up your recording…</div>
      )}
    </div>
  );
}
