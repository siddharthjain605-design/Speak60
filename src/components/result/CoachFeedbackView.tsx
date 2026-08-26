import { useState } from 'react';
import type { CoachFeedback } from '../../types';
import { Card, SectionTitle, SecondaryButton } from '../ui';

export default function CoachFeedbackView({ coach }: { coach: CoachFeedback }) {
  const [showImproved, setShowImproved] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <SectionTitle>What You Did Well</SectionTitle>
        <ul className="space-y-2">
          {coach.whatWentWell.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-200">
              <span className="text-emerald-400">✓</span> {point}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <SectionTitle>What Needs Improvement</SectionTitle>
        <ul className="space-y-2">
          {coach.needsImprovement.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-200">
              <span className="text-amber-400">!</span> {point}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="sm:col-span-2 border-violet-500/30 bg-violet-500/5">
        <SectionTitle>One Thing to Practise Tomorrow</SectionTitle>
        <div className="text-lg font-bold text-violet-300">{coach.focusTomorrow.title}</div>
        <p className="mt-2 text-sm text-zinc-300">{coach.focusTomorrow.detail}</p>
      </Card>
      <Card className="sm:col-span-2">
        <div className="flex items-center justify-between">
          <SectionTitle sub="Only visible after your recording — never shown beforehand.">
            How This Could Have Been Structured
          </SectionTitle>
          <SecondaryButton onClick={() => setShowImproved((s) => !s)}>
            {showImproved ? 'Hide' : 'Show example'}
          </SecondaryButton>
        </div>
        {showImproved && (
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-sm text-zinc-300">
            {coach.improvedVersion}
          </pre>
        )}
      </Card>
    </div>
  );
}
