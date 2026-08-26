import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import ChallengeCalendarGrid from '../components/progress/ChallengeCalendarGrid';

export default function CalendarPage() {
  const attempts = useStore((s) => s.attempts);
  const challengeStartDate = useAuthStore((s) => s.profile?.challenge_start_date ?? null);

  if (!challengeStartDate) {
    return <div className="py-16 text-center text-zinc-500">Draw your first Daily Challenge topic to start the 30-day calendar.</div>;
  }

  return <ChallengeCalendarGrid attempts={attempts} challengeStartDate={challengeStartDate} />;
}
