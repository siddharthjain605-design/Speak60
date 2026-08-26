import { Link } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import ChallengeFlow, { MAX_TRIAL_RUNS } from '../components/challenge/ChallengeFlow';
import { Card, PrimaryButton } from '../components/ui';

export default function TrialRunPage() {
  const trialRunsUsed = useAuthStore((s) => s.profile?.trial_runs_used ?? 0);

  if (trialRunsUsed >= MAX_TRIAL_RUNS) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <Card className="w-full">
          <h1 className="text-xl font-bold text-white">You've used all {MAX_TRIAL_RUNS} trial runs</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You've had a chance to get the hang of the format — prep timer, recording, and the analysis
            breakdown. Ready to start your official 30-day challenge?
          </p>
          <Link to="/" className="mt-4 inline-block">
            <PrimaryButton>Start Day 1</PrimaryButton>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Trial Run</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A no-pressure practice pass through the full Speak60 experience. Doesn't count toward your streak,
          Daily Challenge history, or 30-day report.
        </p>
      </div>
      <ChallengeFlow mode="trial" />
    </div>
  );
}
