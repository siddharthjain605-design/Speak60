import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import * as db from '../lib/db';
import type { Badge, ChallengeAttempt } from '../types';
import { Card, SecondaryButton, SectionTitle } from '../components/ui';
import ProgressContent from '../components/progress/ProgressContent';
import ChallengeCalendarGrid from '../components/progress/ChallengeCalendarGrid';

function AdminControls({ member, onUpdated }: { member: db.FamilyMemberSummary; onUpdated: () => void }) {
  const [name, setName] = useState(member.displayName);
  const [startDate, setStartDate] = useState(member.challengeStartDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(partial: Parameters<typeof db.updateProfileRemote>[1]) {
    setSaving(true);
    setError(null);
    const err = await db.updateProfileRemote(member.id, partial);
    setSaving(false);
    if (err) setError(err);
    else onUpdated();
  }

  return (
    <Card className="border-amber-500/30">
      <SectionTitle sub="Admin-only — visible because you're signed in as the family account administrator.">
        Amend This Member's Record
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Display name</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
            <SecondaryButton disabled={saving} onClick={() => save({ display_name: name })}>Save</SecondaryButton>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Day 1 date (resets their 30-day calendar anchor)
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
            <SecondaryButton disabled={saving} onClick={() => save({ challenge_start_date: startDate || null })}>Save</SecondaryButton>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        To remove trial-run or test data entirely, open the specific day from the calendar below and use
        "Delete This Attempt" on its result page.
      </p>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </Card>
  );
}

export default function FamilyMemberPage() {
  const { userId } = useParams();
  const isAdmin = useAuthStore((s) => s.profile?.is_admin ?? false);
  const [member, setMember] = useState<db.FamilyMemberSummary | null>(null);
  const [attempts, setAttempts] = useState<ChallengeAttempt[] | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdmin || !userId) return;
    db.fetchAllProfiles().then((profiles) => setMember(profiles.find((p) => p.id === userId) ?? null));
    db.fetchAttemptsForUser(userId).then(setAttempts);
    db.fetchBadges(userId).then(setBadges);
  }, [isAdmin, userId, refreshKey]);

  if (!isAdmin) {
    return <div className="py-16 text-center text-zinc-500">This page is only visible to the family account administrator.</div>;
  }

  if (!attempts || !member) {
    return <div className="py-16 text-center text-zinc-500">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/family" className="text-xs text-zinc-500 hover:text-violet-400">← Family Progress</Link>
          <h1 className="mt-1 text-2xl font-bold text-white">{member.displayName}</h1>
        </div>
      </div>

      <AdminControls member={member} onUpdated={() => setRefreshKey((k) => k + 1)} />

      <ProgressContent attempts={attempts} badges={badges} />

      <Card>
        <SectionTitle>Calendar</SectionTitle>
        <ChallengeCalendarGrid
          attempts={attempts}
          challengeStartDate={member.challengeStartDate}
          linkPrefix={`/family/${userId}/result`}
        />
      </Card>
    </div>
  );
}
