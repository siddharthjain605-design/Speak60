import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import * as db from '../lib/db';
import type { Badge, ChallengeAttempt } from '../types';
import { Card, SectionTitle } from '../components/ui';
import ProgressContent from '../components/progress/ProgressContent';
import ChallengeCalendarGrid from '../components/progress/ChallengeCalendarGrid';

export default function FamilyMemberPage() {
  const { userId } = useParams();
  const isAdmin = useAuthStore((s) => s.profile?.is_admin ?? false);
  const [member, setMember] = useState<db.FamilyMemberSummary | null>(null);
  const [attempts, setAttempts] = useState<ChallengeAttempt[] | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!isAdmin || !userId) return;
    db.fetchAllProfiles().then((profiles) => setMember(profiles.find((p) => p.id === userId) ?? null));
    db.fetchAttemptsForUser(userId).then(setAttempts);
    db.fetchBadges(userId).then(setBadges);
  }, [isAdmin, userId]);

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
