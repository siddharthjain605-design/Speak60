import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import { getChallengeDayNumber, getDailyAttempts, getTodaysDailyAttempt, todayISO } from '../lib/storage';
import { currentStreak } from '../lib/badges';
import ChallengeFlow from '../components/challenge/ChallengeFlow';
import { Card, PrimaryButton, StatTile } from '../components/ui';

function PrivacyBanner() {
  const privacyAcknowledged = useAuthStore((s) => s.profile?.privacy_acknowledged ?? false);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  if (privacyAcknowledged) return null;
  return (
    <Card className="border-violet-500/30 bg-violet-500/5">
      <p className="text-sm text-zinc-300">
        Speak60 records audio only when you press Start Speaking. Recordings stay on this device; transcripts
        and scores sync to your family's shared account — see{' '}
        <Link to="/settings" className="text-violet-300 underline">Settings</Link> to review or delete your data.
      </p>
      <button
        onClick={() => updateProfile({ privacy_acknowledged: true })}
        className="mt-2 text-xs font-medium text-violet-400 hover:underline"
      >
        Got it
      </button>
    </Card>
  );
}

export default function HomeScreen() {
  const store = useStore();
  const challengeStartDate = useAuthStore((s) => s.profile?.challenge_start_date ?? null);
  const todays = getTodaysDailyAttempt(store.attempts);
  const dailyCompleted = getDailyAttempts(store.attempts);
  const currentDay = challengeStartDate ? getChallengeDayNumber(challengeStartDate, todayISO()) : 1;
  const streak = currentStreak(dailyCompleted);
  const day1Score = dailyCompleted[0]?.scores?.overall ?? null;
  const bestScore = dailyCompleted.reduce((m, a) => Math.max(m, a.scores?.overall ?? 0), 0);
  const latestScore = dailyCompleted[dailyCompleted.length - 1]?.scores?.overall ?? null;
  const improvementPct = day1Score && latestScore ? Math.round(((latestScore - day1Score) / day1Score) * 100) : null;
  const windowElapsed = currentDay > 30;

  if (!store.loaded) {
    return <div className="py-16 text-center text-zinc-500">Loading your challenge…</div>;
  }

  if (windowElapsed || dailyCompleted.length >= 30) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Your 30-day challenge has wrapped up 🎉</h1>
        <p className="text-zinc-400">Your full 30-Day Speaking Improvement Report is ready.</p>
        <Link to="/report">
          <PrimaryButton>View 30-Day Report</PrimaryButton>
        </Link>
      </div>
    );
  }

  if (todays && todays.status === 'completed') {
    return (
      <div className="flex flex-col gap-6">
        <PrivacyBanner />
        <HeaderStats currentDay={currentDay} streak={streak} latestScore={latestScore} day1Score={day1Score} bestScore={bestScore} improvementPct={improvementPct} />
        <Card className="text-center">
          <div className="text-sm text-zinc-400">Today's challenge is complete.</div>
          <div className="mt-1 text-lg font-semibold text-white">Score: {todays.scores?.overall}/100</div>
          <Link to={`/result/${todays.id}`} className="mt-4 inline-block">
            <PrimaryButton>View Today's Result</PrimaryButton>
          </Link>
          <p className="mt-3 text-xs text-zinc-500">Come back tomorrow for Day {currentDay + 1}. Want more reps? Try Practice Mode.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PrivacyBanner />
      <HeaderStats currentDay={currentDay} streak={streak} latestScore={latestScore} day1Score={day1Score} bestScore={bestScore} improvementPct={improvementPct} />
      <ChallengeFlow mode="daily" />
    </div>
  );
}

function HeaderStats({ currentDay, streak, latestScore, day1Score, bestScore, improvementPct }: {
  currentDay: number; streak: number; latestScore: number | null; day1Score: number | null; bestScore: number; improvementPct: number | null;
}) {
  const displayName = useAuthStore((s) => s.profile?.display_name ?? 'Speaker');
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white">Speak<span className="text-violet-400">60</span></div>
      <div className="mt-1 text-sm text-zinc-500">Think. Structure. Speak. — {displayName}</div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">Day {currentDay} of 30</span>
        {streak > 0 && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-300">🔥 {streak}-Day Streak</span>}
        <span className="text-xs text-zinc-600">{todayISO()}</span>
      </div>
      {latestScore !== null && (
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Current Score" value={latestScore} tone="accent" />
          <StatTile label="Day 1 Score" value={day1Score ?? '-'} />
          <StatTile
            label="Improvement"
            value={improvementPct !== null ? `${improvementPct >= 0 ? '+' : ''}${improvementPct}%` : '-'}
            tone={improvementPct !== null && improvementPct >= 0 ? 'good' : 'bad'}
          />
          <StatTile label="Personal Best" value={bestScore} tone="good" />
        </div>
      )}
    </div>
  );
}
