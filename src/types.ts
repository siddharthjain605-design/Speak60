import type { Difficulty, RawTopic, TopicType } from './data/topics';

export type { Difficulty, TopicType, RawTopic };

export interface Topic {
  id: string;
  text: string;
  category: string;
  subcategory: string;
  difficulty: Difficulty;
  type: TopicType;
  active: boolean;
  lastUsedDate: string | null;
  timesUsed: number;
}

export interface Metrics {
  totalSpeakingTimeSec: number;
  totalWords: number;
  wpm: number;
  fillerCount: number;
  fillersPerMinute: number;
  longPauses: number;
  avgPauseSec: number;
  longestPauseSec: number;
  repeatedPhrases: number;
  incompleteSentences: number;
  avgSentenceLength: number;
  vocabVarietyPct: number;
  pitchRangeHz: [number, number] | null;
  pitchVariationPct: number;
  volumeConsistencyPct: number;
  paceConsistencyPct: number;
  sentenceCount: number;
  fillerBreakdown: Record<string, number>;
}

export interface ScoreBreakdown {
  content: number; // /25
  language: number; // /20
  fluency: number; // /20
  voice: number; // /20
  confidence: number; // /15
  overall: number; // /100
  rubricVersion: string;
  explanations: {
    content: string[];
    language: string[];
    fluency: string[];
    voice: string[];
    confidence: string[];
  };
}

export interface CoachFeedback {
  whatWentWell: string[];
  needsImprovement: string[];
  focusTomorrow: { title: string; detail: string };
  improvedVersion: string;
}

export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
}

export interface ChallengeAttempt {
  id: string;
  isDailyChallenge: boolean;
  day: number | null; // 1..30 if daily challenge
  date: string; // ISO date the attempt was made
  topicId: string;
  topicText: string;
  topicCategory: string;
  topicDifficulty: Difficulty;
  scratchpad: string;
  prepStart: string | null;
  prepEnd: string | null;
  speechStart: string | null;
  speechEnd: string | null;
  transcriptRaw: string;
  transcriptSegments: TranscriptSegment[];
  metrics: Metrics | null;
  scores: ScoreBreakdown | null;
  coach: CoachFeedback | null;
  hasAudio: boolean;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
}

/** Client-side cache of everything synced to Supabase for the signed-in user. */
export interface DataState {
  loaded: boolean;
  topicMeta: Record<string, { active: boolean; lastUsedDate: string | null; timesUsed: number }>;
  attempts: ChallengeAttempt[];
  badges: Badge[];
  customTopics: RawTopic[];
}
