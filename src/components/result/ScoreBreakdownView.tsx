import type { ScoreBreakdown } from '../../types';
import { Card, ScoreGauge, SectionTitle, ProgressBar } from '../ui';

const CATEGORIES: { key: keyof ScoreBreakdown['explanations']; label: string; max: number }[] = [
  { key: 'content', label: 'Content & Structure', max: 25 },
  { key: 'language', label: 'Language & Communication', max: 20 },
  { key: 'fluency', label: 'Fluency', max: 20 },
  { key: 'voice', label: 'Voice Delivery', max: 20 },
  { key: 'confidence', label: 'Confidence & Presence', max: 15 },
];

export default function ScoreBreakdownView({ scores }: { scores: ScoreBreakdown }) {
  return (
    <Card>
      <SectionTitle>Score Breakdown</SectionTitle>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ScoreGauge value={scores.overall} label="Overall" size={140} />
        <div className="flex-1 space-y-4">
          {CATEGORIES.map(({ key, label, max }) => {
            const value = scores[key] as number;
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-200">{label}</span>
                  <span className="font-mono-num text-zinc-400">{value}/{max}</span>
                </div>
                <ProgressBar value={value} max={max} />
                <ul className="mt-1.5 space-y-0.5">
                  {scores.explanations[key].map((line, i) => (
                    <li key={i} className="text-xs text-zinc-500">· {line}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Voice and confidence figures are communication-performance indicators derived from measurable delivery
        traits (pauses, volume, pace, pitch variation) — not medical or scientifically calibrated measurements.
      </p>
    </Card>
  );
}
