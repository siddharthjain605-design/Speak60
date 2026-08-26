import type { Metrics, ScoreBreakdown } from '../../types';
import { Card, SectionTitle } from '../ui';

export default function MetricsTable({ metrics, scores }: { metrics: Metrics; scores: ScoreBreakdown }) {
  const rows: [string, string][] = [
    ['Total Speaking Time', `${metrics.totalSpeakingTimeSec}s`],
    ['Total Words', `${metrics.totalWords}`],
    ['Words Per Minute', `${metrics.wpm}`],
    ['Filler Words', `${metrics.fillerCount}`],
    ['Fillers per Minute', `${metrics.fillersPerMinute}`],
    ['Long Pauses', `${metrics.longPauses}`],
    ['Average Pause', `${metrics.avgPauseSec}s`],
    ['Longest Pause', `${metrics.longestPauseSec}s`],
    ['Repeated Words/Phrases', `${metrics.repeatedPhrases}`],
    ['Incomplete Sentences', `${metrics.incompleteSentences}`],
    ['Average Sentence Length', `${metrics.avgSentenceLength} words`],
    ['Vocabulary Variety', `${metrics.vocabVarietyPct}%`],
    ['Estimated Pitch Range', metrics.pitchRangeHz ? `${metrics.pitchRangeHz[0]}-${metrics.pitchRangeHz[1]} Hz` : 'n/a'],
    ['Volume Consistency', `${metrics.volumeConsistencyPct}%`],
    ['Pace Consistency', `${metrics.paceConsistencyPct}%`],
    ['Fluency Score', `${scores.fluency}/20`],
    ['Content Score', `${scores.content}/25`],
    ['Language Score', `${scores.language}/20`],
    ['Voice Score', `${scores.voice}/20`],
    ['Confidence Indicator', `${scores.confidence}/15`],
    ['Overall Score', `${scores.overall}/100`],
  ];

  return (
    <Card>
      <SectionTitle sub={`Scoring rubric ${scores.rubricVersion} — computed the same way every day for fair comparison.`}>
        Objective Speech Metrics
      </SectionTitle>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-zinc-800/70 py-2 text-sm">
            <span className="text-zinc-400">{label}</span>
            <span className="font-mono-num font-medium text-zinc-100">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
