import type { Badge, ChallengeAttempt, DataState } from '../types';
import { getDailyAttempts } from './storage';

interface BadgeRule {
  id: string;
  name: string;
  description: string;
  check: (daily: ChallengeAttempt[], latest: ChallengeAttempt) => boolean;
}

function currentStreak(daily: ChallengeAttempt[]): number {
  if (daily.length === 0) return 0;
  const sorted = [...daily].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
  let streak = 0;
  let expectedDay = sorted[0].day ?? 0;
  for (const a of sorted) {
    if ((a.day ?? -1) === expectedDay) {
      streak++;
      expectedDay--;
    } else {
      break;
    }
  }
  return streak;
}

const RULES: BadgeRule[] = [
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Completed the Daily Challenge seven days in a row.',
    check: (daily) => currentStreak(daily) >= 7,
  },
  {
    id: 'streak_30',
    name: '30-Day Completion',
    description: 'Finished the full 30-day Speak60 challenge.',
    check: (daily) => daily.length >= 30,
  },
  {
    id: 'filler_killer',
    name: 'Filler Killer',
    description: 'Delivered a speech with 2 or fewer filler words.',
    check: (_daily, latest) => (latest.metrics?.fillerCount ?? 99) <= 2,
  },
  {
    id: 'zero_long_pause',
    name: 'Zero Long-Pause Speech',
    description: 'Completed a full minute with no long pauses.',
    check: (_daily, latest) => (latest.metrics?.longPauses ?? 99) === 0,
  },
  {
    id: 'wpm_100',
    name: '100 WPM Club',
    description: 'Sustained at least 100 words per minute.',
    check: (_daily, latest) => (latest.metrics?.wpm ?? 0) >= 100,
  },
  {
    id: 'wpm_120',
    name: '120 WPM Club',
    description: 'Sustained at least 120 words per minute.',
    check: (_daily, latest) => (latest.metrics?.wpm ?? 0) >= 120,
  },
  {
    id: 'personal_best',
    name: 'Personal Best',
    description: 'Set a new personal-best overall score.',
    check: (daily, latest) => {
      const prior = daily.filter((a) => a.id !== latest.id);
      const best = prior.reduce((m, a) => Math.max(m, a.scores?.overall ?? 0), 0);
      return (latest.scores?.overall ?? 0) > best && prior.length > 0;
    },
  },
  {
    id: 'most_improved',
    name: 'Most Improved',
    description: 'Improved overall score by 15+ points versus the previous attempt.',
    check: (daily, latest) => {
      const sorted = [...daily].sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
      const idx = sorted.findIndex((a) => a.id === latest.id);
      if (idx <= 0) return false;
      const prev = sorted[idx - 1];
      return (latest.scores?.overall ?? 0) - (prev.scores?.overall ?? 0) >= 15;
    },
  },
  {
    id: 'consistency',
    name: 'Consistency Award',
    description: 'Completed 5 Daily Challenges without missing a day.',
    check: (daily) => currentStreak(daily) >= 5,
  },
];

export function evaluateNewBadges(state: Pick<DataState, 'attempts' | 'badges'>, latest: ChallengeAttempt): Badge[] {
  const daily = getDailyAttempts(state.attempts);
  const earnedIds = new Set(state.badges.map((b) => b.id));
  const newBadges: Badge[] = [];
  for (const rule of RULES) {
    if (earnedIds.has(rule.id)) continue;
    if (rule.check(daily, latest)) {
      newBadges.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        earnedAt: new Date().toISOString(),
      });
    }
  }
  return newBadges;
}

export { currentStreak };
