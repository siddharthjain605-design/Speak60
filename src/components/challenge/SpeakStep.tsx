import { useEffect, useRef, useState } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { playGo, playCountdownTick, playUrgentBeep, playChime } from '../../lib/sound';
import { PrimaryButton, SecondaryButton } from '../ui';
import type { Topic, TranscriptSegment } from '../../types';

const BASE_SECONDS = 60;
const EXTEND_STEP_SECONDS = 60;

type Phase = 'ready' | 'countdown' | 'recording' | 'finishing';

export interface SpeakResult {
  blob: Blob | null;
  transcript: string;
  segments: TranscriptSegment[];
  durationSec: number;
  micError: string | null;
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function SpeakStep({
  topic, scratchpad, maxSpeakSeconds, onComplete,
}: {
  topic: Topic;
  scratchpad: string;
  maxSpeakSeconds: number;
  onComplete: (result: SpeakResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [micError, setMicError] = useState<string | null>(null);
  const [display, setDisplay] = useState(formatTime(BASE_SECONDS));
  const [awaitingExtend, setAwaitingExtend] = useState(false);
  const [notesOpen, setNotesOpen] = useState(true);
  const [urgent, setUrgent] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechStartRef = useRef(0);
  const speech = useSpeechRecognition();

  const targetSecRef = useRef(BASE_SECONDS);
  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);
  const finishRef = useRef<() => void>(() => {});

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
      durationSec: Math.min(durationSec, maxSpeakSeconds + 2),
      micError,
    });
  };

  useEffect(() => {
    finishRef.current = finishRecording;
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

  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      elapsedRef.current += 1;
      const remaining = targetSecRef.current - elapsedRef.current;
      setDisplay(formatTime(remaining));
      setUrgent(remaining <= 10 && remaining > 0);
      if (remaining === 10) playUrgentBeep();
      if (remaining <= 0) {
        if (targetSecRef.current >= maxSpeakSeconds) {
          clearInterval(id);
          finishRef.current();
        } else {
          pausedRef.current = true;
          setAwaitingExtend(true);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, maxSpeakSeconds]);

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
  }

  function handleExtend() {
    targetSecRef.current = Math.min(maxSpeakSeconds, targetSecRef.current + EXTEND_STEP_SECONDS);
    pausedRef.current = false;
    setAwaitingExtend(false);
    playChime();
  }

  const remainingAllowance = maxSpeakSeconds - targetSecRef.current;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
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
        <div className="font-mono-num animate-pulse-glow rounded-full text-8xl font-extrabold text-violet-300">{countdownNum}</div>
      )}

      {phase === 'recording' && !awaitingExtend && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-rose-400">
            <span className="h-3 w-3 animate-pulse rounded-full bg-rose-500" />
            <span className="text-sm font-semibold uppercase tracking-wide">Recording</span>
          </div>
          <div className={`font-mono-num text-7xl font-extrabold tabular-nums sm:text-8xl ${urgent ? 'text-rose-400' : 'text-white'}`}>
            {display}
          </div>
          <p className="text-xs text-zinc-500">Speak naturally.</p>
          <SecondaryButton onClick={() => finishRef.current()}>Finish Speech Now</SecondaryButton>
        </div>
      )}

      {phase === 'recording' && awaitingExtend && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-6 py-8">
          <div className="text-lg font-bold text-white">Time's up — want to keep going?</div>
          <p className="max-w-sm text-sm text-zinc-400">
            You can extend by another minute (up to {formatTime(maxSpeakSeconds)} total) or finish here.
          </p>
          <div className="flex gap-3">
            <PrimaryButton onClick={handleExtend} disabled={remainingAllowance <= 0}>
              +1 Minute
            </PrimaryButton>
            <SecondaryButton onClick={() => finishRef.current()}>I'm Done</SecondaryButton>
          </div>
        </div>
      )}

      {phase === 'finishing' && (
        <div className="text-lg text-zinc-400">Wrapping up your recording…</div>
      )}

      {(phase === 'recording' || phase === 'countdown') && scratchpad.trim().length > 0 && (
        <div className="w-full max-w-md">
          <button
            onClick={() => setNotesOpen((o) => !o)}
            className="mx-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {notesOpen ? '▾' : '▸'} Your notes
          </button>
          {notesOpen && (
            <div className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-left text-xs leading-relaxed text-zinc-400">
              {scratchpad}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
