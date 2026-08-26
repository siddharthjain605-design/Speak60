import type { Metrics, TranscriptSegment } from '../types';

export const DEFAULT_FILLER_WORDS = [
  'um', 'uh', 'actually', 'basically', 'you know', 'like', 'matlab',
  'i think', 'so', 'okay', 'kind of', 'sort of', 'literally', 'right',
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'to', 'of', 'in', 'on', 'for', 'with', 'that', 'this', 'it', 'as',
  'at', 'by', 'from', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'our',
  'your', 'their', 'his', 'her', 'its', 'if', 'then', 'so', 'because',
]);

const TRAILING_WORDS_SUGGESTING_INCOMPLETE = new Set([
  'and', 'but', 'so', 'because', 'that', 'which', 'is', 'the', 'a', 'to',
  'of', 'with', 'for', 'in', 'on', 'i', 'we', 'it', 'as', 'if', 'or',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function countFillerOccurrences(lowerText: string, filler: string): number {
  const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'g');
  const matches = lowerText.match(re);
  return matches ? matches.length : 0;
}

function countRepeatedPhrases(words: string[]): number {
  let repeats = 0;
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1]) repeats++;
  }
  const seen = new Map<string, number>();
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    seen.set(trigram, (seen.get(trigram) ?? 0) + 1);
  }
  for (const count of seen.values()) {
    if (count > 1) repeats += count - 1;
  }
  return repeats;
}

export interface SpeechAnalysisInput {
  transcript: string;
  segments: TranscriptSegment[];
  durationSec: number;
  customFillerWords: string[];
  audioPauses?: { count: number; avgSec: number; longestSec: number };
  volumeConsistencyPct?: number;
  paceConsistencyPct?: number;
  pitchRangeHz?: [number, number] | null;
  pitchVariationPct?: number;
}

export function analyzeTranscript(input: SpeechAnalysisInput): Metrics {
  const {
    transcript, segments, durationSec, customFillerWords,
    audioPauses, volumeConsistencyPct, paceConsistencyPct,
    pitchRangeHz, pitchVariationPct,
  } = input;

  const lower = transcript.toLowerCase();
  const words = tokenize(transcript);
  const totalWords = words.length;
  const minutes = Math.max(durationSec / 60, 1 / 60);
  const wpm = Math.round(totalWords / minutes);

  const fillerList = Array.from(new Set([...DEFAULT_FILLER_WORDS, ...customFillerWords.map((f) => f.toLowerCase())]));
  const fillerBreakdown: Record<string, number> = {};
  let fillerCount = 0;
  for (const filler of fillerList) {
    const n = countFillerOccurrences(lower, filler);
    if (n > 0) {
      fillerBreakdown[filler] = n;
      fillerCount += n;
    }
  }
  const fillersPerMinute = Math.round((fillerCount / minutes) * 10) / 10;

  const sentenceUnits = segments.length > 0
    ? segments.map((s) => s.text.trim()).filter(Boolean)
    : transcript.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);

  const sentenceCount = Math.max(sentenceUnits.length, 1);
  const avgSentenceLength = Math.round((totalWords / sentenceCount) * 10) / 10;

  let incompleteSentences = 0;
  for (const unit of sentenceUnits) {
    const unitWords = tokenize(unit);
    if (unitWords.length === 0) continue;
    const last = unitWords[unitWords.length - 1];
    if (TRAILING_WORDS_SUGGESTING_INCOMPLETE.has(last) || unitWords.length <= 2) {
      incompleteSentences++;
    }
  }

  const contentWords = words.filter((w) => !STOPWORDS.has(w) && !fillerList.includes(w));
  const uniqueContentWords = new Set(contentWords);
  const vocabVarietyPct = contentWords.length > 0
    ? Math.round((uniqueContentWords.size / contentWords.length) * 1000) / 10
    : 0;

  const repeatedPhrases = countRepeatedPhrases(words);

  return {
    totalSpeakingTimeSec: Math.round(durationSec),
    totalWords,
    wpm,
    fillerCount,
    fillersPerMinute,
    longPauses: audioPauses?.count ?? 0,
    avgPauseSec: audioPauses?.avgSec ?? 0,
    longestPauseSec: audioPauses?.longestSec ?? 0,
    repeatedPhrases,
    incompleteSentences,
    avgSentenceLength,
    vocabVarietyPct,
    pitchRangeHz: pitchRangeHz ?? null,
    pitchVariationPct: pitchVariationPct ?? 0,
    volumeConsistencyPct: volumeConsistencyPct ?? 0,
    paceConsistencyPct: paceConsistencyPct ?? 0,
    sentenceCount,
    fillerBreakdown,
  };
}

/** Highlights filler words in a transcript for the UI, returning HTML-safe spans data. */
export interface HighlightToken {
  text: string;
  isFiller: boolean;
  isRepeat: boolean;
}

export function highlightTranscript(transcript: string, customFillerWords: string[]): HighlightToken[] {
  const fillerList = new Set([...DEFAULT_FILLER_WORDS, ...customFillerWords.map((f) => f.toLowerCase())]);
  const rawTokens = transcript.split(/(\s+)/);
  const tokens: HighlightToken[] = [];
  let prevWord = '';
  for (const raw of rawTokens) {
    if (/^\s+$/.test(raw) || raw === '') {
      tokens.push({ text: raw, isFiller: false, isRepeat: false });
      continue;
    }
    const clean = raw.toLowerCase().replace(/[^a-z0-9']/g, '');
    const isFiller = fillerList.has(clean);
    const isRepeat = clean.length > 0 && clean === prevWord;
    tokens.push({ text: raw, isFiller, isRepeat });
    if (clean) prevWord = clean;
  }
  return tokens;
}
