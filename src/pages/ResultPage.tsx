import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import AttemptResult from '../components/result/AttemptResult';
import BadgeCelebration from '../components/result/BadgeCelebration';
import type { Badge } from '../types';

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const attempt = useStore((s) => s.attempts.find((a) => a.id === id));
  const attempts = useStore((s) => s.attempts);
  const deleteAttempt = useStore((s) => s.deleteAttempt);
  const customFillerWords = useAuthStore((s) => s.profile?.custom_filler_words ?? []);
  const isAdmin = useAuthStore((s) => s.profile?.is_admin ?? false);
  const newBadges = (location.state as { newBadges?: Badge[] } | null)?.newBadges ?? [];

  if (!attempt) {
    return (
      <div className="text-center text-zinc-500">
        <p>We couldn't find that attempt.</p>
        <Link to="/" className="mt-3 inline-block text-violet-400 hover:underline">Back to Today</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BadgeCelebration badges={newBadges} />
      <AttemptResult
        attempt={attempt}
        customFillerWords={customFillerWords}
        dailyAttemptsForComparison={attempts}
        allowDeleteAudio={isAdmin}
        onDeleteAttempt={isAdmin ? async () => {
          const error = await deleteAttempt(attempt.id);
          if (!error) navigate('/calendar');
          return error;
        } : undefined}
      />
    </div>
  );
}
