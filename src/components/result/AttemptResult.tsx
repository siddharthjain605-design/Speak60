import type { ChallengeAttempt } from '../../types';
import { getDailyAttempts } from '../../lib/storage';
import { Pill } from '../ui';
import TranscriptView from './TranscriptView';
import MetricsTable from './MetricsTable';
import ScoreBreakdownView from './ScoreBreakdownView';
import CoachFeedbackView from './CoachFeedbackView';
import DailyComparison from './DailyComparison';
import AudioPlayback from './AudioPlayback';
import { DIFFICULTY_LABELS } from '../../lib/topicEngine';

export default function AttemptResult({
  attempt, customFillerWords, dailyAttemptsForComparison, allowDeleteAudio = true,
}: {
  attempt: ChallengeAttempt;
  customFillerWords: string[];
  dailyAttemptsForComparison: ChallengeAttempt[];
  allowDeleteAudio?: boolean;
}) {
  const dailyAttempts = getDailyAttempts(dailyAttemptsForComparison);

  if (attempt.status !== 'completed' || !attempt.scores || !attempt.metrics || !attempt.coach) {
    return <p className="text-zinc-500">This attempt is still in progress.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {attempt.isDailyChallenge && <Pill tone="accent">Day {attempt.day}</Pill>}
        {!attempt.isDailyChallenge && <Pill>Practice</Pill>}
        <Pill>{attempt.topicCategory}</Pill>
        <Pill tone="warn">{DIFFICULTY_LABELS[attempt.topicDifficulty]}</Pill>
        <span className="text-xs text-zinc-500">{new Date(attempt.date).toLocaleDateString()}</span>
      </div>

      <h1 className="text-xl font-semibold text-white sm:text-2xl">"{attempt.topicText}"</h1>

      <ScoreBreakdownView scores={attempt.scores} />
      <AudioPlayback attemptId={attempt.id} hasAudio={attempt.hasAudio} allowDelete={allowDeleteAudio} />
      <TranscriptView transcript={attempt.transcriptRaw} customFillerWords={customFillerWords} />
      <MetricsTable metrics={attempt.metrics} scores={attempt.scores} />
      <CoachFeedbackView coach={attempt.coach} />
      {attempt.isDailyChallenge && dailyAttempts.length > 0 && (
        <DailyComparison current={attempt} allDaily={dailyAttempts} />
      )}
    </div>
  );
}
