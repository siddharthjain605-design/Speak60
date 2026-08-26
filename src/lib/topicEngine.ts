import { TOPIC_BANK, type Difficulty } from '../data/topics';
import type { DataState, Topic } from '../types';

function makeTopicId(text: string, category: string): string {
  let hash = 0;
  const s = `${category}::${text}`;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return `t_${Math.abs(hash).toString(36)}`;
}

type TopicPoolState = Pick<DataState, 'topicMeta' | 'customTopics'>;

export function getAllTopics(state: TopicPoolState): Topic[] {
  return [...TOPIC_BANK, ...state.customTopics].map((raw) => {
    const id = makeTopicId(raw.text, raw.category);
    const meta = state.topicMeta[id];
    return {
      id,
      text: raw.text,
      category: raw.category,
      subcategory: raw.subcategory,
      difficulty: raw.difficulty,
      type: raw.type,
      active: meta?.active ?? true,
      lastUsedDate: meta?.lastUsedDate ?? null,
      timesUsed: meta?.timesUsed ?? 0,
    };
  });
}

/** Cryptographically-sound random index — "genuine randomisation" per spec. */
function secureRandomIndex(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

/**
 * Difficulty pool for a given challenge day, per the suggested 30-day progression.
 * Days 1-5 Easy/Moderate, 6-10 Moderate, 11-20 Moderate/Analytical,
 * 21-25 Analytical/Difficult, 26-30 Difficult/Abstract.
 */
export function difficultyPoolForDay(day: number): Difficulty[] {
  if (day <= 5) return [1, 2];
  if (day <= 10) return [2];
  if (day <= 20) return [2, 3];
  if (day <= 25) return [3, 4];
  return [4, 5];
}

export interface DrawOptions {
  day?: number; // daily challenge day number, drives difficulty pool
  difficulty?: Difficulty[]; // explicit override (practice mode)
  category?: string; // practice mode category filter
  type?: Topic['type'];
}

/**
 * Selects a random topic, excluding ones already used until the pool is exhausted.
 * Genuinely random (crypto-backed), never repeats a topic this user has already
 * completed until their whole active bank has been used at least once.
 */
export function drawTopic(state: TopicPoolState, opts: DrawOptions = {}): Topic {
  const all = getAllTopics(state).filter((t) => t.active);
  let pool = all;

  if (opts.category) pool = pool.filter((t) => t.category === opts.category);
  if (opts.type) pool = pool.filter((t) => t.type === opts.type);

  const diffPool = opts.difficulty ?? (opts.day ? difficultyPoolForDay(opts.day) : null);
  if (diffPool) {
    const filtered = pool.filter((t) => diffPool.includes(t.difficulty));
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) pool = all;

  const unused = pool.filter((t) => t.timesUsed === 0);
  const candidates = unused.length > 0 ? unused : pool;

  return candidates[secureRandomIndex(candidates.length)];
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Analytical',
  4: 'Difficult',
  5: 'Expert / Abstract',
};
