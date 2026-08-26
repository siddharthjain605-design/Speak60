import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import AttemptResult from '../components/result/AttemptResult';

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const attempt = useStore((s) => s.attempts.find((a) => a.id === id));
  const attempts = useStore((s) => s.attempts);
  const deleteAttempt = useStore((s) => s.deleteAttempt);
  const customFillerWords = useAuthStore((s) => s.profile?.custom_filler_words ?? []);

  if (!attempt) {
    return (
      <div className="text-center text-zinc-500">
        <p>We couldn't find that attempt.</p>
        <Link to="/" className="mt-3 inline-block text-violet-400 hover:underline">Back to Today</Link>
      </div>
    );
  }

  return (
    <AttemptResult
      attempt={attempt}
      customFillerWords={customFillerWords}
      dailyAttemptsForComparison={attempts}
      onDeleteAttempt={async () => {
        const error = await deleteAttempt(attempt.id);
        if (!error) navigate('/calendar');
        return error;
      }}
    />
  );
}
