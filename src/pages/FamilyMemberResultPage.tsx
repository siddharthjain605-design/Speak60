import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import * as db from '../lib/db';
import type { ChallengeAttempt } from '../types';
import AttemptResult from '../components/result/AttemptResult';

export default function FamilyMemberResultPage() {
  const { userId, id } = useParams();
  const isAdmin = useAuthStore((s) => s.profile?.is_admin ?? false);
  const [attempt, setAttempt] = useState<ChallengeAttempt | null | undefined>(undefined);
  const [allAttempts, setAllAttempts] = useState<ChallengeAttempt[]>([]);
  const [customFillerWords, setCustomFillerWords] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin || !userId || !id) return;
    db.fetchAttemptById(id).then(setAttempt);
    db.fetchAttemptsForUser(userId).then(setAllAttempts);
    db.fetchAllProfiles().then((profiles) => {
      const member = profiles.find((p) => p.id === userId);
      setCustomFillerWords(member?.customFillerWords ?? []);
    });
  }, [isAdmin, userId, id]);

  if (!isAdmin) {
    return <div className="py-16 text-center text-zinc-500">This page is only visible to the family account administrator.</div>;
  }

  if (attempt === undefined) {
    return <div className="py-16 text-center text-zinc-500">Loading…</div>;
  }

  if (!attempt) {
    return (
      <div className="text-center text-zinc-500">
        <p>We couldn't find that attempt.</p>
        <Link to={`/family/${userId}`} className="mt-3 inline-block text-violet-400 hover:underline">Back to member</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to={`/family/${userId}`} className="text-xs text-zinc-500 hover:text-violet-400">← Back to member</Link>
      <AttemptResult
        attempt={attempt}
        customFillerWords={customFillerWords}
        dailyAttemptsForComparison={allAttempts}
        allowDeleteAudio={false}
      />
    </div>
  );
}
