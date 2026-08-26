import type { Badge, ChallengeAttempt } from '../../types';
import { getDailyAttempts } from '../../lib/storage';
import { buildTrend, categoryAverages } from '../../lib/analytics';
import { currentStreak } from '../../lib/badges';
import { Card, Pill, ProgressBar, SectionTitle, StatTile } from '../ui';
import TrendChart from './TrendChart';

export default function ProgressContent({ attempts, badges }: { attempts: ChallengeAttempt[]; badges: Badge[] }) {
  const daily = getDailyAttempts(attempts);
  const trend = buildTrend(daily);
  const categories = categoryAverages([...daily, ...attempts.filter((a) => !a.isDailyChallenge && a.status === 'completed')]);
  const streak = currentStreak(daily);
  const best = daily.reduce((m, a) => Math.max(m, a.scores?.overall ?? 0), 0);
  const day1 = trend[0]?.overall ?? null;
  const latest = trend[trend.length - 1]?.overall ?? null;
  const improvementPct = day1 && latest ? Math.round(((latest - day1) / day1) * 100) : null;

  if (daily.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-500">
        No completed Daily Challenges yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Current Streak" value={`${streak} Days`} tone="accent" />
        <StatTile label="Challenge Progress" value={`${daily.length} / 30`} />
        <StatTile label="Overall Score" value={latest ?? '-'} tone="good" />
        <StatTile label="Personal Best" value={best} tone="good" />
      </div>

      {improvementPct !== null && (
        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Day 1 → Current Day Improvement</span>
            <span className={`font-mono-num text-lg font-bold ${improvementPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {improvementPct >= 0 ? '+' : ''}{improvementPct}%
            </span>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TrendChart title="Overall Score" data={trend} dataKey="overall" color="#a78bfa" />
        <TrendChart title="Confidence" data={trend} dataKey="confidence" color="#34d399" />
        <TrendChart title="Fluency" data={trend} dataKey="fluency" color="#60a5fa" />
        <TrendChart title="Fillers per Minute" data={trend} dataKey="fillersPerMinute" color="#fb7185" />
        <TrendChart title="Words per Minute" data={trend} dataKey="wpm" color="#fbbf24" />
        <TrendChart title="Long Pauses" data={trend} dataKey="longPauses" color="#f472b6" />
        <TrendChart title="Vocabulary Diversity %" data={trend} dataKey="vocabVarietyPct" color="#38bdf8" />
        <TrendChart title="Pitch Variation %" data={trend} dataKey="pitchVariationPct" color="#c084fc" />
        <TrendChart title="Content Score" data={trend} dataKey="content" color="#4ade80" />
        <TrendChart title="Language Score" data={trend} dataKey="language" color="#818cf8" />
      </div>

      <Card>
        <SectionTitle sub="Averaged across every completed attempt, daily challenge and practice.">
          Topic Category Performance
        </SectionTitle>
        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-zinc-300">{c.category} <span className="text-zinc-600">({c.count})</span></span>
                <span className="font-mono-num text-zinc-400">{c.avg}</span>
              </div>
              <ProgressBar value={c.avg} max={100} tone={c.avg >= 70 ? 'good' : c.avg < 50 ? 'bad' : 'accent'} />
            </div>
          ))}
        </div>
      </Card>

      {badges.length > 0 && (
        <Card>
          <SectionTitle>Badges Earned</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Pill key={b.id} tone="accent">{b.name}</Pill>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
