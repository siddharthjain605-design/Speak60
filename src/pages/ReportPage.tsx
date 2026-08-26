import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import { getDailyAttempts } from '../lib/storage';
import { buildTrend, categoryAverages } from '../lib/analytics';
import { currentStreak } from '../lib/badges';
import { generateThirtyDayReport } from '../lib/pdfReport';
import { Card, PrimaryButton, SectionTitle, StatTile } from '../components/ui';
import TrendChart from '../components/progress/TrendChart';

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export default function ReportPage() {
  const attempts = useStore((s) => s.attempts);
  const displayName = useAuthStore((s) => s.profile?.display_name ?? 'Speaker');
  const daily = getDailyAttempts(attempts);

  if (daily.length === 0) {
    return <div className="py-16 text-center text-zinc-500">No completed Daily Challenges yet.</div>;
  }

  const sorted = [...daily].sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
  const day1 = sorted[0];
  const dayLast = sorted[sorted.length - 1];
  const first5 = sorted.slice(0, 5);
  const last5 = sorted.slice(-5);
  const trend = buildTrend(daily);
  const categories = categoryAverages(daily);
  const streak = currentStreak(daily);

  const allFillers: Record<string, number> = {};
  for (const a of sorted) {
    for (const [word, count] of Object.entries(a.metrics?.fillerBreakdown ?? {})) {
      allFillers[word] = (allFillers[word] ?? 0) + count;
    }
  }
  const topFillers = Object.entries(allFillers).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const bestSpeech = [...sorted].sort((a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0))[0];
  const hardestTopic = [...sorted].sort((a, b) => (a.scores?.overall ?? 100) - (b.scores?.overall ?? 100))[0];

  const metricDeltas = [
    { label: 'Fluency', delta: (dayLast.scores?.fluency ?? 0) - (day1.scores?.fluency ?? 0) },
    { label: 'Confidence', delta: (dayLast.scores?.confidence ?? 0) - (day1.scores?.confidence ?? 0) },
    { label: 'Content & Structure', delta: (dayLast.scores?.content ?? 0) - (day1.scores?.content ?? 0) },
    { label: 'Language', delta: (dayLast.scores?.language ?? 0) - (day1.scores?.language ?? 0) },
    { label: 'Voice Delivery', delta: (dayLast.scores?.voice ?? 0) - (day1.scores?.voice ?? 0) },
  ];
  const mostImproved = [...metricDeltas].sort((a, b) => b.delta - a.delta)[0];
  const stillNeedsWork = [...metricDeltas].sort((a, b) => a.delta - b.delta)[0];

  const overallImprovementPct = day1.scores?.overall
    ? Math.round((((dayLast.scores?.overall ?? 0) - day1.scores.overall) / day1.scores.overall) * 1000) / 10
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">30-Day Speaking Improvement Report</h1>
        <p className="mt-2 text-zinc-400">
          Your speaking ability improved from <span className="font-bold text-white">{day1.scores?.overall}/100</span> to{' '}
          <span className="font-bold text-emerald-400">{dayLast.scores?.overall}/100</span> over the challenge.
        </p>
        <PrimaryButton onClick={() => generateThirtyDayReport(daily, displayName)} className="mt-4">
          Download PDF Report
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Days Completed" value={daily.length} />
        <StatTile label="Longest Streak" value={streak} tone="accent" />
        <StatTile label="Overall Improvement" value={`${overallImprovementPct >= 0 ? '+' : ''}${overallImprovementPct}%`} tone={overallImprovementPct >= 0 ? 'good' : 'bad'} />
        <StatTile label="Best Score" value={Math.max(...sorted.map((a) => a.scores?.overall ?? 0))} tone="good" />
      </div>

      <Card>
        <SectionTitle>Day 1 vs Day {dayLast.day}</SectionTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="pb-2">Metric</th><th className="pb-2 text-right">Day 1</th><th className="pb-2 text-right">Day {dayLast.day}</th><th className="pb-2 text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Overall Score', day1.scores?.overall, dayLast.scores?.overall],
              ['Confidence', day1.scores?.confidence, dayLast.scores?.confidence],
              ['Fluency', day1.scores?.fluency, dayLast.scores?.fluency],
              ['WPM', day1.metrics?.wpm, dayLast.metrics?.wpm],
              ['Fillers/min', day1.metrics?.fillersPerMinute, dayLast.metrics?.fillersPerMinute],
              ['Long Pauses', day1.metrics?.longPauses, dayLast.metrics?.longPauses],
              ['Vocabulary Diversity %', day1.metrics?.vocabVarietyPct, dayLast.metrics?.vocabVarietyPct],
            ].map(([label, a, b]) => (
              <tr key={label as string} className="border-t border-zinc-800/70">
                <td className="py-2 text-zinc-300">{label}</td>
                <td className="py-2 text-right font-mono-num text-zinc-500">{a ?? '-'}</td>
                <td className="py-2 text-right font-mono-num text-zinc-100">{b ?? '-'}</td>
                <td className={`py-2 text-right font-mono-num font-semibold ${(Number(b) - Number(a)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(Number(b) - Number(a)) >= 0 ? '+' : ''}{Math.round((Number(b) - Number(a)) * 10) / 10}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>First 5 Days Average vs Last 5 Days Average</SectionTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="pb-2">Metric</th><th className="pb-2 text-right">First 5</th><th className="pb-2 text-right">Last 5</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Overall Score', avg(first5.map((a) => a.scores?.overall ?? 0)), avg(last5.map((a) => a.scores?.overall ?? 0))],
              ['Fluency', avg(first5.map((a) => a.scores?.fluency ?? 0)), avg(last5.map((a) => a.scores?.fluency ?? 0))],
              ['WPM', avg(first5.map((a) => a.metrics?.wpm ?? 0)), avg(last5.map((a) => a.metrics?.wpm ?? 0))],
              ['Fillers/min', avg(first5.map((a) => a.metrics?.fillersPerMinute ?? 0)), avg(last5.map((a) => a.metrics?.fillersPerMinute ?? 0))],
            ].map(([label, a, b]) => (
              <tr key={label as string} className="border-t border-zinc-800/70">
                <td className="py-2 text-zinc-300">{label}</td>
                <td className="py-2 text-right font-mono-num text-zinc-500">{a}</td>
                <td className="py-2 text-right font-mono-num text-zinc-100">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TrendChart title="Overall Score" data={trend} dataKey="overall" color="#a78bfa" />
        <TrendChart title="Confidence" data={trend} dataKey="confidence" color="#34d399" />
        <TrendChart title="Fluency" data={trend} dataKey="fluency" color="#60a5fa" />
        <TrendChart title="Fillers per Minute" data={trend} dataKey="fillersPerMinute" color="#fb7185" />
        <TrendChart title="Words per Minute" data={trend} dataKey="wpm" color="#fbbf24" />
        <TrendChart title="Vocabulary Diversity %" data={trend} dataKey="vocabVarietyPct" color="#38bdf8" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionTitle>Biggest Improvement</SectionTitle>
          <p className="text-sm text-zinc-300">{mostImproved.label} improved the most, up {mostImproved.delta.toFixed(1)} points.</p>
        </Card>
        <Card>
          <SectionTitle>Areas Still Requiring Work</SectionTitle>
          <p className="text-sm text-zinc-300">{stillNeedsWork.label} showed the least movement ({stillNeedsWork.delta >= 0 ? '+' : ''}{stillNeedsWork.delta.toFixed(1)}).</p>
        </Card>
        <Card>
          <SectionTitle>Most Common Filler Words</SectionTitle>
          <p className="text-sm text-zinc-300">
            {topFillers.length > 0 ? topFillers.map(([w, c]) => `"${w}" (${c})`).join(', ') : 'No significant filler pattern detected.'}
          </p>
        </Card>
        <Card>
          <SectionTitle>Most Improved Speaking Metric</SectionTitle>
          <p className="text-sm text-zinc-300">{mostImproved.label}, up {mostImproved.delta.toFixed(1)} points from Day 1.</p>
        </Card>
        <Card>
          <SectionTitle>Strongest Topic Category</SectionTitle>
          <p className="text-sm text-zinc-300">{categories[0]?.category ?? '-'} (avg {categories[0]?.avg ?? '-'}/100)</p>
        </Card>
        <Card>
          <SectionTitle>Weakest Topic Category</SectionTitle>
          <p className="text-sm text-zinc-300">{categories[categories.length - 1]?.category ?? '-'} (avg {categories[categories.length - 1]?.avg ?? '-'}/100)</p>
        </Card>
        <Card>
          <SectionTitle>Best Speech</SectionTitle>
          <p className="text-sm text-zinc-300">Day {bestSpeech.day} — "{bestSpeech.topicText}" ({bestSpeech.scores?.overall}/100)</p>
        </Card>
        <Card>
          <SectionTitle>Most Difficult Topic</SectionTitle>
          <p className="text-sm text-zinc-300">Day {hardestTopic.day} — "{hardestTopic.topicText}" ({hardestTopic.scores?.overall}/100)</p>
        </Card>
        <Card className="sm:col-span-2">
          <SectionTitle>Consistency / Streak Analysis</SectionTitle>
          <p className="text-sm text-zinc-300">
            You completed {daily.length} of your first 30 challenge days, with a longest streak of {streak} consecutive days.
          </p>
        </Card>
      </div>

      <Card className="border-violet-500/30 bg-violet-500/5 text-center">
        <p className="text-lg font-semibold text-violet-200">
          Your speaking ability improved from {day1.scores?.overall}/100 to {dayLast.scores?.overall}/100 over the 30-day challenge.
        </p>
      </Card>
    </div>
  );
}
