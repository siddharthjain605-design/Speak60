import { useState } from 'react';
import ChallengeFlow from '../components/challenge/ChallengeFlow';
import { CATEGORIES } from '../data/topics';
import type { Difficulty, TopicType } from '../types';
import { PrimaryButton, SecondaryButton, Card, SectionTitle } from '../components/ui';
import { DIFFICULTY_LABELS } from '../lib/topicEngine';

const DIFFICULTY_PRESETS: Record<string, Difficulty[]> = {
  easy: [1],
  moderate: [2, 3],
  difficult: [4],
  abstract: [5],
};

const QUICK_CATEGORIES = ['Business', 'Current Affairs', 'History', 'Politics', 'Philosophy'];

export default function PracticePage() {
  const [filter, setFilter] = useState<{ category?: string; difficulty?: Difficulty; type?: TopicType } | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  if (filter) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <SecondaryButton onClick={() => setFilter(null)}>← Change filters</SecondaryButton>
        </div>
        <ChallengeFlow key={sessionKey} mode="practice" practiceFilter={filter} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Practice Mode</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Draw unlimited topics. These don't count toward your Daily Challenge streak or 30-day report.
        </p>
      </div>

      <Card>
        <SectionTitle>Difficulty</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => { setFilter({}); setSessionKey((k) => k + 1); }}>Random</PrimaryButton>
          {(['easy', 'moderate', 'difficult', 'abstract'] as const).map((key) => (
            <SecondaryButton
              key={key}
              onClick={() => { setFilter({ difficulty: DIFFICULTY_PRESETS[key][0] }); setSessionKey((k) => k + 1); }}
            >
              {DIFFICULTY_LABELS[DIFFICULTY_PRESETS[key][0]]}
            </SecondaryButton>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Quick Categories</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {QUICK_CATEGORIES.map((c) => (
            <SecondaryButton key={c} onClick={() => { setFilter({ category: c }); setSessionKey((k) => k + 1); }}>
              {c}
            </SecondaryButton>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Browse All Categories</SectionTitle>
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
          {CATEGORIES.map((c) => (
            <SecondaryButton key={c} onClick={() => { setFilter({ category: c }); setSessionKey((k) => k + 1); }}>
              {c}
            </SecondaryButton>
          ))}
        </div>
      </Card>

      <div className="flex justify-center">
        <SecondaryButton onClick={() => { setFilter({}); setSessionKey((k) => k + 1); }} className="border-amber-500/40 text-amber-300">
          🎲 Surprise Me
        </SecondaryButton>
      </div>
    </div>
  );
}
