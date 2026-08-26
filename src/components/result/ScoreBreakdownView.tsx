import type { ScoreBreakdown } from '../../types';
import { Card, SectionTitle } from '../ui';
import ScoreReveal from './ScoreReveal';

const CATEGORIES: { key: keyof ScoreBreakdown['explanations']; label: string; max: number; icon: string; color: string }[] = [
  { key: 'content', label: 'Content & Structure', max: 25, icon: '🧩', color: '#4ade80' },
  { key: 'language', label: 'Language & Communication', max: 20, icon: '💬', color: '#818cf8' },
  { key: 'fluency', label: 'Fluency', max: 20, icon: '🌊', color: '#60a5fa' },
  { key: 'voice', label: 'Voice Delivery', max: 20, icon: '🎙️', color: '#fbbf24' },
  { key: 'confidence', label: 'Confidence & Presence', max: 15, icon: '⭐', color: '#f472b6' },
];

export default function ScoreBreakdownView({ scores }: { scores: ScoreBreakdown }) {
  return (
    <div className="flex flex-col gap-4">
      <ScoreReveal score={scores.overall} />
      <Card>
        <SectionTitle>Score Breakdown</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map(({ key, label, max, icon, color }) => {
            const value = scores[key] as number;
            const pct = Math.round((value / max) * 100);
            return (
              <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <span aria-hidden>{icon}</span> {label}
                  </span>
                  <span className="font-mono-num text-sm font-bold" style={{ color }}>{value}<span className="text-zinc-600">/{max}</span></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}77, ${color})` }}
                  />
                </div>
                <ul className="mt-2 space-y-0.5">
                  {scores.explanations[key].map((line, i) => (
                    <li key={i} className="text-xs text-zinc-500">· {line}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Voice and confidence figures are communication-performance indicators derived from measurable delivery
          traits (pauses, volume, pace, pitch variation) — not medical or scientifically calibrated measurements.
        </p>
      </Card>
    </div>
  );
}
