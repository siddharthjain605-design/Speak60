import type { ChallengeAttempt } from '../../types';
import { Card, SectionTitle } from '../ui';

function diffStr(a: number, b: number): string {
  const d = Math.round((b - a) * 10) / 10;
  return d >= 0 ? `+${d}` : `${d}`;
}

function diffTone(a: number, b: number, lowerIsBetter = false): 'good' | 'bad' | 'neutral' {
  const d = b - a;
  if (Math.abs(d) < 0.001) return 'neutral';
  const better = lowerIsBetter ? d < 0 : d > 0;
  return better ? 'good' : 'bad';
}

export default function DailyComparison({ current, allDaily }: { current: ChallengeAttempt; allDaily: ChallengeAttempt[] }) {
  const sorted = [...allDaily].sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
  const idx = sorted.findIndex((a) => a.id === current.id);
  const yesterday = idx > 0 ? sorted[idx - 1] : null;
  const day1 = sorted[0];
  const last7 = sorted.slice(Math.max(0, idx - 6), idx + 1);
  const personalBest = sorted.reduce((best, a) => ((a.scores?.overall ?? 0) > (best?.scores?.overall ?? -1) ? a : best), sorted[0]);

  const avg = (nums: number[]) => (nums.length ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10 : 0);

  if (!current.scores || !current.metrics) return null;

  const rows: { label: string; value: number; lowerIsBetter?: boolean }[] = [
    { label: 'Overall Score', value: current.scores.overall },
    { label: 'WPM', value: current.metrics.wpm },
    { label: 'Fillers', value: current.metrics.fillerCount, lowerIsBetter: true },
    { label: 'Long Pauses', value: current.metrics.longPauses, lowerIsBetter: true },
    { label: 'Confidence', value: current.scores.confidence },
    { label: 'Fluency', value: current.scores.fluency },
  ];

  return (
    <Card>
      <SectionTitle sub={yesterday ? `Compared with Day ${yesterday.day}` : 'This is your Day 1 baseline — future days will compare against it.'}>
        {yesterday ? 'Today vs Yesterday' : 'Day 1 Baseline'}
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="pb-2">Metric</th>
              {yesterday && <th className="pb-2 text-right">Yesterday</th>}
              <th className="pb-2 text-right">Today</th>
              {yesterday && <th className="pb-2 text-right">Change</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const yVal = yesterday ? (r.label === 'Overall Score' ? yesterday.scores?.overall
                : r.label === 'WPM' ? yesterday.metrics?.wpm
                : r.label === 'Fillers' ? yesterday.metrics?.fillerCount
                : r.label === 'Long Pauses' ? yesterday.metrics?.longPauses
                : r.label === 'Confidence' ? yesterday.scores?.confidence
                : yesterday.scores?.fluency) ?? 0 : 0;
              const tone = yesterday ? diffTone(yVal, r.value, r.lowerIsBetter) : 'neutral';
              return (
                <tr key={r.label} className="border-t border-zinc-800/70">
                  <td className="py-2 text-zinc-300">{r.label}</td>
                  {yesterday && <td className="py-2 text-right font-mono-num text-zinc-500">{yVal}</td>}
                  <td className="py-2 text-right font-mono-num font-semibold text-zinc-100">{r.value}</td>
                  {yesterday && (
                    <td className={`py-2 text-right font-mono-num font-semibold ${tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {diffStr(yVal, r.value)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
        <div className="rounded-lg bg-zinc-950 p-3">
          <div className="text-zinc-500">7-Day Avg</div>
          <div className="mt-1 font-mono-num text-lg font-semibold text-zinc-100">{avg(last7.map((a) => a.scores?.overall ?? 0))}</div>
        </div>
        <div className="rounded-lg bg-zinc-950 p-3">
          <div className="text-zinc-500">Personal Best</div>
          <div className="mt-1 font-mono-num text-lg font-semibold text-emerald-400">{personalBest?.scores?.overall ?? '-'}</div>
        </div>
        <div className="rounded-lg bg-zinc-950 p-3">
          <div className="text-zinc-500">Day 1 Baseline</div>
          <div className="mt-1 font-mono-num text-lg font-semibold text-zinc-100">{day1?.scores?.overall ?? '-'}</div>
        </div>
      </div>
    </Card>
  );
}
