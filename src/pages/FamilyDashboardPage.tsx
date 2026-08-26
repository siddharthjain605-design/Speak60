import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import * as db from '../lib/db';
import { getChallengeDayNumber, getDailyAttempts, todayISO } from '../lib/storage';
import { currentStreak } from '../lib/badges';
import type { ChallengeAttempt } from '../types';
import { Card, Pill, SectionTitle, StatTile } from '../components/ui';

interface Row {
  id: string;
  displayName: string;
  challengeStartDate: string | null;
  attempts: ChallengeAttempt[];
}

export default function FamilyDashboardPage() {
  const isAdmin = useAuthStore((s) => s.profile?.is_admin ?? false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([db.fetchAllProfiles(), db.fetchAllAttempts()]).then(([profiles, byUser]) => {
      if (cancelled) return;
      setRows(
        profiles.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          challengeStartDate: p.challengeStartDate,
          attempts: byUser[p.id] ?? [],
        })),
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="py-16 text-center text-zinc-500">This page is only visible to the family account administrator.</div>;
  }

  if (loading || !rows) {
    return <div className="py-16 text-center text-zinc-500">Loading family progress…</div>;
  }

  const today = todayISO();

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle sub="Everyone who has signed in with this family's Speak60 link. Click a name for their full history.">
        Family Progress
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const daily = getDailyAttempts(row.attempts);
          const currentDay = row.challengeStartDate ? getChallengeDayNumber(row.challengeStartDate, today) : null;
          const streak = currentStreak(daily);
          const latest = daily[daily.length - 1]?.scores?.overall ?? null;
          const best = daily.reduce((m, a) => Math.max(m, a.scores?.overall ?? 0), 0);

          return (
            <Link key={row.id} to={`/family/${row.id}`}>
              <Card className="flex h-full flex-col gap-3 hover:border-violet-500/60">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">{row.displayName}</span>
                  {currentDay && <Pill tone="accent">Day {Math.min(currentDay, 30)} / 30</Pill>}
                </div>
                {daily.length === 0 ? (
                  <p className="text-sm text-zinc-500">Hasn't started the Daily Challenge yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <StatTile label="Latest" value={latest ?? '-'} tone="accent" />
                    <StatTile label="Best" value={best} tone="good" />
                    <StatTile label="Streak" value={streak} />
                  </div>
                )}
                <div className="text-xs text-zinc-500">{daily.length} day(s) completed</div>
              </Card>
            </Link>
          );
        })}
        {rows.length === 0 && <p className="text-zinc-500">No family members have signed in yet.</p>}
      </div>
    </div>
  );
}
