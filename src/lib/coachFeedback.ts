import type { CoachFeedback, Metrics, ScoreBreakdown } from '../types';

// Deterministic, rule-based coach. No external LLM call is wired up in this
// build (see README) — every line below is derived directly from measured
// metrics so feedback stays consistent day to day, per spec item 25.
// A server-side LLM call could later slot in here for the qualitative
// "improved version" text while keeping this file's factor list as its input.

interface Factor {
  id: string;
  severity: (m: Metrics, s: ScoreBreakdown) => number; // 0 (fine) .. 1 (bad)
  strength: (m: Metrics) => string;
  weakness: (m: Metrics) => string;
  focusTitle: string;
  focusDetail: (m: Metrics) => string;
}

const FACTORS: Factor[] = [
  {
    id: 'fillers',
    severity: (m) => Math.min(1, m.fillersPerMinute / 18),
    strength: (m) => `Fillers stayed low — only ${m.fillerCount} in the whole minute.`,
    weakness: (m) => `${m.fillerCount} filler words crept in (${m.fillersPerMinute}/min).`,
    focusTitle: 'Reduce fillers',
    focusDetail: (m) => `You used filler words like "${Object.keys(m.fillerBreakdown)[0] ?? 'um'}" ${m.fillerCount} times in ${m.totalSpeakingTimeSec}s. Instead of filling silence, deliberately pause for 0.5-1 second — a silent pause reads as confident, a filler reads as unsure.`,
  },
  {
    id: 'pauses',
    severity: (m) => Math.min(1, m.longPauses / 6),
    strength: (m) => `Delivery stayed continuous — only ${m.longPauses} long pause(s).`,
    weakness: (m) => `${m.longPauses} long pause(s), the longest lasting ${m.longestPauseSec}s.`,
    focusTitle: 'Bridge your pauses',
    focusDetail: (m) => `You had ${m.longPauses} pause(s) over half a second, the longest ${m.longestPauseSec}s. Prepare one linking phrase ("which brings me to...") to use whenever your mind goes blank, instead of stopping speech entirely.`,
  },
  {
    id: 'pace',
    severity: (m) => Math.min(1, Math.abs(m.wpm - 130) / 90),
    strength: (m) => `Your pace of ${m.wpm} WPM sat right in the natural conversational range.`,
    weakness: (m) => m.wpm > 150
      ? `You spoke quickly at ${m.wpm} WPM, which can outrun listener comprehension.`
      : `You spoke slowly at ${m.wpm} WPM, which can read as hesitant.`,
    focusTitle: 'Steady your pace',
    focusDetail: (m) => m.wpm > 150
      ? `At ${m.wpm} words per minute you're above the 110-150 comfortable range. Practise reading a paragraph aloud while consciously breathing between sentences to slow down.`
      : `At ${m.wpm} words per minute you're below the 110-150 comfortable range. Try speaking with slightly more energy and shorter sentences to build momentum.`,
  },
  {
    id: 'structure',
    severity: (_m, s) => Math.min(1, Math.max(0, (9 - (s.content - 8)) / 9)),
    strength: () => 'Your answer had a clear shape — a real opening and a real close.',
    weakness: () => 'The structure was hard to follow — no clear opening or conclusion.',
    focusTitle: 'Use an Opening → Points → Conclusion shape',
    focusDetail: () => 'Before you speak tomorrow, mentally slot your answer into four beats: an opening line, 2-3 points, one example, and a one-sentence conclusion. Even 3 seconds of that mental sort helps a listener follow you.',
  },
  {
    id: 'vocabulary',
    severity: (m) => Math.min(1, Math.max(0, (55 - m.vocabVarietyPct) / 55)),
    strength: (m) => `Vocabulary stayed varied — ${m.vocabVarietyPct}% of your content words were unique.`,
    weakness: (m) => `Vocabulary variety was low at ${m.vocabVarietyPct}%, meaning you leaned on the same words repeatedly.`,
    focusTitle: 'Widen your word choice',
    focusDetail: (m) => `Only ${m.vocabVarietyPct}% of your content words were unique. When you notice yourself reaching for the same word twice, swap in a synonym — it's a small habit that compounds fast.`,
  },
  {
    id: 'incomplete',
    severity: (m) => Math.min(1, m.sentenceCount > 0 ? (m.incompleteSentences / m.sentenceCount) * 1.5 : 0),
    strength: (m) => `You finished your thoughts cleanly — ${m.sentenceCount - m.incompleteSentences}/${m.sentenceCount} sentences landed completely.`,
    weakness: (m) => `${m.incompleteSentences} of your ${m.sentenceCount} sentences trailed off without finishing.`,
    focusTitle: 'Finish every sentence',
    focusDetail: (m) => `${m.incompleteSentences} sentence(s) trailed off mid-thought. Before you start a sentence, know its ending — if you're unsure, keep it shorter rather than let it drift.`,
  },
  {
    id: 'volume',
    severity: (m) => Math.min(1, Math.max(0, (75 - m.volumeConsistencyPct) / 75)),
    strength: (m) => `Your volume stayed steady and easy to follow (${m.volumeConsistencyPct}% consistency).`,
    weakness: (m) => `Your volume fluctuated a fair amount (${m.volumeConsistencyPct}% consistency) — some words may have been hard to hear.`,
    focusTitle: 'Keep your volume steady',
    focusDetail: (m) => `Volume consistency measured ${m.volumeConsistencyPct}%. Try recording yourself and speaking to a fixed point across the room — it naturally evens out projection.`,
  },
  {
    id: 'monotony',
    severity: (m) => Math.min(1, Math.max(0, (15 - m.pitchVariationPct) / 15)),
    strength: () => 'Your tone had natural variation rather than sounding flat.',
    weakness: () => 'Your tone stayed fairly flat, which can make it harder for listeners to stay engaged.',
    focusTitle: 'Add vocal variety',
    focusDetail: () => 'Pick one key sentence in your next answer and deliberately say it slightly louder or slower than the rest — emphasis signals what matters and breaks monotony.',
  },
];

function buildImprovedVersion(topicText: string, transcript: string): string {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  const anchor1 = topWords[0] ?? 'this idea';
  const anchor2 = topWords[1] ?? 'a second angle';

  return [
    `Opening: "When I think about — ${topicText.replace(/\?$/, '')} — my view is clear, and I want to walk you through why."`,
    `Point 1: Start with the most direct reason, built around "${anchor1}" — the strongest idea already in your answer.`,
    `Point 2: Add a contrasting or supporting angle using "${anchor2}" to show you've considered more than one side.`,
    `Example: Ground it with one concrete, specific example — a real event, person, or personal experience — instead of speaking only in generalities.`,
    `Conclusion: "So overall, [restate your one-line view] — and that's why it matters."`,
  ].join('\n');
}

export function generateCoachFeedback(
  metrics: Metrics,
  scores: ScoreBreakdown,
  topicText: string,
  transcript: string,
): CoachFeedback {
  const ranked = FACTORS.map((f) => ({ f, sev: f.severity(metrics, scores) }))
    .sort((a, b) => b.sev - a.sev);

  const strengths = [...ranked].sort((a, b) => a.sev - b.sev).slice(0, 3).map(({ f }) => f.strength(metrics));
  const weaknesses = ranked.slice(0, 3).map(({ f }) => f.weakness(metrics));

  const top = ranked[0].f;

  return {
    whatWentWell: strengths,
    needsImprovement: weaknesses,
    focusTomorrow: {
      title: top.focusTitle,
      detail: top.focusDetail(metrics),
    },
    improvedVersion: buildImprovedVersion(topicText, transcript),
  };
}
