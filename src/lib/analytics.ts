import type { ChallengeAttempt } from '../types';

export function categoryAverages(attempts: ChallengeAttempt[]): { category: string; avg: number; count: number }[] {
  const byCategory: Record<string, number[]> = {};
  for (const a of attempts) {
    if (!a.scores) continue;
    byCategory[a.topicCategory] = byCategory[a.topicCategory] ?? [];
    byCategory[a.topicCategory].push(a.scores.overall);
  }
  return Object.entries(byCategory)
    .map(([category, scores]) => ({
      category,
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }))
    .sort((a, b) => b.avg - a.avg);
}

export interface TrendPoint {
  day: number;
  date: string;
  overall: number;
  confidence: number;
  fluency: number;
  content: number;
  language: number;
  voice: number;
  wpm: number;
  fillersPerMinute: number;
  longPauses: number;
  vocabVarietyPct: number;
  pitchVariationPct: number;
}

export function buildTrend(dailyAttempts: ChallengeAttempt[]): TrendPoint[] {
  return [...dailyAttempts]
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
    .filter((a) => a.scores && a.metrics)
    .map((a) => ({
      day: a.day ?? 0,
      date: a.date,
      overall: a.scores!.overall,
      confidence: a.scores!.confidence,
      fluency: a.scores!.fluency,
      content: a.scores!.content,
      language: a.scores!.language,
      voice: a.scores!.voice,
      wpm: a.metrics!.wpm,
      fillersPerMinute: a.metrics!.fillersPerMinute,
      longPauses: a.metrics!.longPauses,
      vocabVarietyPct: a.metrics!.vocabVarietyPct,
      pitchVariationPct: a.metrics!.pitchVariationPct,
    }));
}
