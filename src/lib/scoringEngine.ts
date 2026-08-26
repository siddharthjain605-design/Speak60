import type { Metrics, ScoreBreakdown } from '../types';

// Bump this whenever the rubric formula changes. Historical scores keep the
// rubric version they were computed under, so a future upgrade never silently
// reshapes Day-1-vs-Day-30 comparisons — see spec item 25.
export const RUBRIC_VERSION = 'v1.0.0';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function plateau(value: number, lo: number, hi: number, falloff: number): number {
  if (value >= lo && value <= hi) return 1;
  const dist = value < lo ? lo - value : value - hi;
  return clamp(1 - dist / falloff, 0, 1);
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'to', 'of', 'in', 'on', 'for', 'with', 'that', 'this', 'it', 'as', 'at',
  'by', 'from', 'do', 'does', 'you', 'your', 'what', 'why', 'how', 'should',
  'would', 'could', 'if', 'one', 'day', 'more', 'most', 'about',
]);

function extractKeywords(topicText: string): string[] {
  return topicText
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

const OPENING_MARKERS = ['i think', 'in my opinion', 'i believe', 'when it comes to', "let's talk about", 'to begin', 'first of all', 'personally'];
const TRANSITION_MARKERS = ['firstly', 'secondly', 'also', 'another', 'moreover', 'in addition', 'on the other hand', 'furthermore', 'apart from', 'besides'];
const EXAMPLE_MARKERS = ['for example', 'for instance', 'such as', 'like when', 'a good example', 'case in point'];
const CLOSING_MARKERS = ['in conclusion', 'overall', 'to sum up', 'finally', 'so overall', 'in summary', 'to conclude', 'therefore i believe'];

function countMarkers(lowerText: string, markers: string[]): number {
  return markers.filter((m) => lowerText.includes(m)).length;
}

export function computeScores(metrics: Metrics, transcript: string, topicText: string): ScoreBreakdown {
  const lower = transcript.toLowerCase();
  const contentExpl: string[] = [];
  const languageExpl: string[] = [];
  const fluencyExpl: string[] = [];
  const voiceExpl: string[] = [];
  const confidenceExpl: string[] = [];

  // --- A. Content & Structure (25) ---
  const keywords = extractKeywords(topicText);
  const matched = keywords.filter((k) => lower.includes(k));
  const overlap = keywords.length > 0 ? matched.length / keywords.length : 0.5;
  let relevance = (0.5 + 0.5 * overlap) * 8;
  if (metrics.totalWords < 15) relevance *= 0.5;
  contentExpl.push(`Topic relevance: ${matched.length}/${keywords.length || 1} key topic terms referenced (${Math.round(overlap * 100)}% overlap).`);

  const hasOpening = countMarkers(lower, OPENING_MARKERS) > 0;
  const hasTransition = countMarkers(lower, TRANSITION_MARKERS) > 0;
  const hasClosing = countMarkers(lower, CLOSING_MARKERS) > 0;
  const structureCategories = [hasOpening, hasTransition, hasClosing].filter(Boolean).length;
  const structure = (structureCategories / 3) * 9;
  contentExpl.push(`Structure: ${hasOpening ? 'clear opening' : 'no clear opening'}, ${hasTransition ? 'used transitions between points' : 'few/no transition words'}, ${hasClosing ? 'reached a conclusion' : 'no closing statement detected'}.`);

  const hasExample = countMarkers(lower, EXAMPLE_MARKERS) > 0;
  const examples = hasExample ? 4 : (lower.includes('example') ? 2 : 0);
  contentExpl.push(hasExample ? 'At least one concrete example given.' : 'No concrete example detected.');

  const incompleteRatio = metrics.sentenceCount > 0 ? metrics.incompleteSentences / metrics.sentenceCount : 0;
  const coherence = clamp(1 - incompleteRatio, 0, 1) * 4;
  contentExpl.push(`${metrics.incompleteSentences} incomplete/trailing sentence(s) out of ${metrics.sentenceCount}.`);

  const content = clamp(relevance + structure + examples + coherence, 0, 25);

  // --- B. Language & Communication (20) ---
  const vocabScore = clamp(metrics.vocabVarietyPct / 60, 0, 1) * 6;
  languageExpl.push(`Vocabulary variety: ${metrics.vocabVarietyPct}% unique content words.`);

  const lengthFit = 1 - clamp(Math.abs(metrics.avgSentenceLength - 14) / 14, 0, 1);
  const grammarScore = (lengthFit * 0.5 + clamp(1 - incompleteRatio, 0, 1) * 0.5) * 6;
  languageExpl.push(`Average sentence length: ${metrics.avgSentenceLength} words (ideal range 8-20).`);

  const repRate = metrics.totalWords > 0 ? metrics.repeatedPhrases / metrics.totalWords : 0;
  const conciseness = clamp(1 - repRate * 20, 0, 1) * 4;
  languageExpl.push(`${metrics.repeatedPhrases} repeated word/phrase instance(s).`);

  const fillerFactor = clamp(1 - metrics.fillersPerMinute / 20, 0, 1);
  const paceFactor = 1 - clamp(Math.abs(metrics.wpm - 130) / 130, 0, 1) * 0.5;
  const articulation = (fillerFactor * 0.6 + paceFactor * 0.4) * 4;

  const language = clamp(vocabScore + grammarScore + conciseness + articulation, 0, 20);

  // --- C. Fluency (20) ---
  const paceScore = plateau(metrics.wpm, 110, 150, 60) * 7;
  fluencyExpl.push(`Speaking pace: ${metrics.wpm} WPM (ideal 110-150).`);

  const fillerScoreF = clamp(1 - metrics.fillersPerMinute / 25, 0, 1) * 6;
  fluencyExpl.push(`${metrics.fillerCount} filler word(s) — ${metrics.fillersPerMinute}/min.`);

  const pauseScore = clamp(1 - metrics.longPauses / 8, 0, 1) * 4;
  fluencyExpl.push(`${metrics.longPauses} long pause(s), longest ${metrics.longestPauseSec}s.`);

  const continuityScore = clamp(1 - (metrics.repeatedPhrases + metrics.incompleteSentences) / 10, 0, 1) * 3;

  const fluency = clamp(paceScore + fillerScoreF + pauseScore + continuityScore, 0, 20);

  // --- D. Voice Delivery (20) ---
  const paceConsistencyScore = (metrics.paceConsistencyPct / 100) * 6;
  voiceExpl.push(`Pace consistency: ${metrics.paceConsistencyPct}%.`);

  const monotonyScore = (1 - clamp(Math.abs(metrics.pitchVariationPct - 25) / 40, 0, 1)) * 6;
  voiceExpl.push(metrics.pitchRangeHz
    ? `Estimated pitch range ${metrics.pitchRangeHz[0]}-${metrics.pitchRangeHz[1]} Hz, variation ${metrics.pitchVariationPct}% (indicative only).`
    : 'Pitch could not be reliably estimated from this recording.');

  const volumeScore = (metrics.volumeConsistencyPct / 100) * 5;
  voiceExpl.push(`Volume consistency: ${metrics.volumeConsistencyPct}%.`);

  const clarityScore = clamp(1 - metrics.fillersPerMinute / 30, 0, 1) * 3;

  const voice = clamp(paceConsistencyScore + monotonyScore + volumeScore + clarityScore, 0, 20);

  // --- E. Confidence & Presence (15) ---
  const hesitationScore = clamp(1 - metrics.fillersPerMinute / 25, 0, 1) * 4;
  const pauseConfScore = clamp(1 - metrics.longPauses / 6, 0, 1) * 3;
  const volumeConfScore = (metrics.volumeConsistencyPct / 100) * 3;
  const completionScore = clamp(1 - incompleteRatio, 0, 1) * 3;
  const paceConfScore = (metrics.paceConsistencyPct / 100) * 2;

  confidenceExpl.push(`Hesitation frequency: ${metrics.fillersPerMinute} fillers/min.`);
  confidenceExpl.push(`${metrics.longPauses} long pause(s) during delivery.`);
  confidenceExpl.push(`Volume held steady ${metrics.volumeConsistencyPct}% of the time.`);
  confidenceExpl.push(`${metrics.sentenceCount - metrics.incompleteSentences}/${metrics.sentenceCount} sentences completed cleanly.`);

  const confidence = clamp(hesitationScore + pauseConfScore + volumeConfScore + completionScore + paceConfScore, 0, 15);

  const overall = Math.round(content + language + fluency + voice + confidence);

  return {
    content: Math.round(content * 10) / 10,
    language: Math.round(language * 10) / 10,
    fluency: Math.round(fluency * 10) / 10,
    voice: Math.round(voice * 10) / 10,
    confidence: Math.round(confidence * 10) / 10,
    overall: clamp(overall, 0, 100),
    rubricVersion: RUBRIC_VERSION,
    explanations: {
      content: contentExpl,
      language: languageExpl,
      fluency: fluencyExpl,
      voice: voiceExpl,
      confidence: confidenceExpl,
    },
  };
}
