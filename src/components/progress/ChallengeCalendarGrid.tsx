import { Link } from 'react-router-dom';
import type { ChallengeAttempt } from '../../types';
import { dateForChallengeDay, getChallengeDayNumber, todayISO } from '../../lib/storage';
import { Card, Pill, SectionTitle } from '../ui';

export default function ChallengeCalendarGrid({
  attempts, challengeStartDate, linkPrefix = '/result',
}: {
  attempts: ChallengeAttempt[];
  challengeStartDate: string | null;
  linkPrefix?: string;
}) {
  if (!challengeStartDate) {
    return <div className="py-8 text-center text-zinc-500">No Daily Challenge started yet.</div>;
  }

  const today = todayISO();
  const currentDay = getChallengeDayNumber(challengeStartDate, today);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle sub="Click a completed day to revisit its topic, transcript, audio, and score.">
        30-Day Challenge Calendar
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {days.map((day) => {
          const date = dateForChallengeDay(challengeStartDate, day);
          const attempt = attempts.find((a) => a.isDailyChallenge && a.day === day && a.status === 'completed');
          const isFuture = day > currentDay;
          const isToday = day === currentDay;
          const missed = !attempt && !isFuture && !isToday;

          const content = (
            <Card className={`flex flex-col gap-1 ${attempt ? 'hover:border-violet-500/60' : ''} ${isToday ? 'border-violet-500/60' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-200">Day {day}</span>
                {attempt ? (
                  <Pill tone="good">Completed</Pill>
                ) : isToday ? (
                  <Pill tone="accent">Today</Pill>
                ) : missed ? (
                  <Pill tone="bad">Missed</Pill>
                ) : (
                  <Pill>Upcoming</Pill>
                )}
              </div>
              <div className="text-xs text-zinc-500">{date}</div>
              {attempt && (
                <>
                  <div className="mt-1 truncate text-xs text-zinc-400" title={attempt.topicText}>{attempt.topicText}</div>
                  <div className="font-mono-num text-lg font-bold text-white">{attempt.scores?.overall}</div>
                </>
              )}
            </Card>
          );

          return attempt ? (
            <Link key={day} to={`${linkPrefix}/${attempt.id}`}>{content}</Link>
          ) : (
            <div key={day}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
