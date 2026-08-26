import { useCallback, useRef, useState } from 'react';
import type { TranscriptSegment } from '../types';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function useSpeechRecognition() {
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [supported] = useState(isSpeechRecognitionSupported());
  const [active, setActive] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startTimeRef = useRef<number>(0);
  const finalTextRef = useRef('');
  const activeRef = useRef(false);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    startTimeRef.current = performance.now();
    finalTextRef.current = '';
    setFinalText('');
    setInterimText('');
    setSegments([]);

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const endSec = (performance.now() - startTimeRef.current) / 1000;
          const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
          const approxStart = Math.max(0, endSec - Math.max(1, wordCount / 2.5));
          setSegments((prev) => [...prev, { startSec: approxStart, endSec, text: text.trim() }]);
          finalTextRef.current = `${finalTextRef.current} ${text}`.trim();
          setFinalText(finalTextRef.current);
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = () => {
      // Swallow errors (e.g. no-speech) — the session continues until stop() is called.
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition && activeRef.current) {
        try {
          recognition.start();
        } catch {
          // already stopping
        }
      }
    };

    recognitionRef.current = recognition;
    activeRef.current = true;
    setActive(true);
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  return {
    supported,
    active,
    start,
    stop,
    interimText,
    finalText,
    segments,
    fullTranscript: `${finalText} ${interimText}`.trim(),
  };
}
