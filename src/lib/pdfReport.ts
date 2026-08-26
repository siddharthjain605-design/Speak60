import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ChallengeAttempt } from '../types';

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function generateThirtyDayReport(attempts: ChallengeAttempt[], displayName: string): void {
  const sorted = [...attempts].sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
  const day1 = sorted[0];
  const day30 = sorted[sorted.length - 1];
  const first5 = sorted.slice(0, 5);
  const last5 = sorted.slice(-5);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text('Speak60 — 30-Day Speaking Improvement Report', 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Prepared for ${displayName} · Generated ${new Date().toLocaleDateString()}`, 14, 28);

  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.text('Day 1 vs Day 30', 14, 40);

  const metricRow = (
    label: string,
    d1: number | string,
    d30: number | string,
    improvement: string,
  ) => [label, String(d1), String(d30), improvement];

  const improvementStr = (a: number, b: number, lowerIsBetter = false) => {
    const diff = lowerIsBetter ? a - b : b - a;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${Math.round(diff * 10) / 10}`;
  };

  autoTable(doc, {
    startY: 44,
    head: [['Metric', 'Day 1', `Day ${day30.day}`, 'Improvement']],
    body: [
      metricRow('Overall Score', day1.scores?.overall ?? '-', day30.scores?.overall ?? '-', improvementStr(day1.scores?.overall ?? 0, day30.scores?.overall ?? 0)),
      metricRow('Confidence', day1.scores?.confidence ?? '-', day30.scores?.confidence ?? '-', improvementStr(day1.scores?.confidence ?? 0, day30.scores?.confidence ?? 0)),
      metricRow('Fluency', day1.scores?.fluency ?? '-', day30.scores?.fluency ?? '-', improvementStr(day1.scores?.fluency ?? 0, day30.scores?.fluency ?? 0)),
      metricRow('WPM', day1.metrics?.wpm ?? '-', day30.metrics?.wpm ?? '-', improvementStr(day1.metrics?.wpm ?? 0, day30.metrics?.wpm ?? 0)),
      metricRow('Fillers/min', day1.metrics?.fillersPerMinute ?? '-', day30.metrics?.fillersPerMinute ?? '-', improvementStr(day1.metrics?.fillersPerMinute ?? 0, day30.metrics?.fillersPerMinute ?? 0, true)),
      metricRow('Long Pauses', day1.metrics?.longPauses ?? '-', day30.metrics?.longPauses ?? '-', improvementStr(day1.metrics?.longPauses ?? 0, day30.metrics?.longPauses ?? 0, true)),
      metricRow('Vocabulary Diversity %', day1.metrics?.vocabVarietyPct ?? '-', day30.metrics?.vocabVarietyPct ?? '-', improvementStr(day1.metrics?.vocabVarietyPct ?? 0, day30.metrics?.vocabVarietyPct ?? 0)),
      metricRow('Content & Structure', day1.scores?.content ?? '-', day30.scores?.content ?? '-', improvementStr(day1.scores?.content ?? 0, day30.scores?.content ?? 0)),
      metricRow('Voice Delivery', day1.scores?.voice ?? '-', day30.scores?.voice ?? '-', improvementStr(day1.scores?.voice ?? 0, day30.scores?.voice ?? 0)),
      metricRow('Language Quality', day1.scores?.language ?? '-', day30.scores?.language ?? '-', improvementStr(day1.scores?.language ?? 0, day30.scores?.language ?? 0)),
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [124, 58, 237] },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.text('First 5 Days Average vs Last 5 Days Average', 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Metric', 'First 5 Days', 'Last 5 Days', 'Change']],
    body: [
      metricRow('Overall Score', avg(first5.map((a) => a.scores?.overall ?? 0)), avg(last5.map((a) => a.scores?.overall ?? 0)), improvementStr(avg(first5.map((a) => a.scores?.overall ?? 0)), avg(last5.map((a) => a.scores?.overall ?? 0)))),
      metricRow('Fluency', avg(first5.map((a) => a.scores?.fluency ?? 0)), avg(last5.map((a) => a.scores?.fluency ?? 0)), improvementStr(avg(first5.map((a) => a.scores?.fluency ?? 0)), avg(last5.map((a) => a.scores?.fluency ?? 0)))),
      metricRow('WPM', avg(first5.map((a) => a.metrics?.wpm ?? 0)), avg(last5.map((a) => a.metrics?.wpm ?? 0)), improvementStr(avg(first5.map((a) => a.metrics?.wpm ?? 0)), avg(last5.map((a) => a.metrics?.wpm ?? 0)))),
      metricRow('Fillers/min', avg(first5.map((a) => a.metrics?.fillersPerMinute ?? 0)), avg(last5.map((a) => a.metrics?.fillersPerMinute ?? 0)), improvementStr(avg(first5.map((a) => a.metrics?.fillersPerMinute ?? 0)), avg(last5.map((a) => a.metrics?.fillersPerMinute ?? 0)), true)),
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [124, 58, 237] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  const allFillers: Record<string, number> = {};
  for (const a of sorted) {
    for (const [word, count] of Object.entries(a.metrics?.fillerBreakdown ?? {})) {
      allFillers[word] = (allFillers[word] ?? 0) + count;
    }
  }
  const topFillers = Object.entries(allFillers).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const byCategory: Record<string, number[]> = {};
  for (const a of sorted) {
    if (!a.scores) continue;
    byCategory[a.topicCategory] = byCategory[a.topicCategory] ?? [];
    byCategory[a.topicCategory].push(a.scores.overall);
  }
  const categoryAverages = Object.entries(byCategory)
    .map(([cat, scores]) => [cat, avg(scores)] as const)
    .sort((a, b) => b[1] - a[1]);

  const bestSpeech = [...sorted].sort((a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0))[0];
  const hardestTopic = [...sorted].sort((a, b) => (a.scores?.overall ?? 100) - (b.scores?.overall ?? 100))[0];

  const overallImprovementPct = day1.scores?.overall
    ? Math.round(((( day30.scores?.overall ?? 0) - day1.scores.overall) / day1.scores.overall) * 1000) / 10
    : 0;

  doc.setFontSize(13);
  doc.text('Summary', 14, y);
  doc.setFontSize(10);
  const lines = [
    `Biggest improvement: ${improvementStr(day1.scores?.overall ?? 0, day30.scores?.overall ?? 0)} points overall from Day 1 to Day ${day30.day}.`,
    `Most common filler words: ${topFillers.map(([w, c]) => `"${w}" (${c})`).join(', ') || 'none significant'}.`,
    `Strongest topic category: ${categoryAverages[0]?.[0] ?? '-'} (avg ${categoryAverages[0]?.[1] ?? '-'}).`,
    `Weakest topic category: ${categoryAverages[categoryAverages.length - 1]?.[0] ?? '-'} (avg ${categoryAverages[categoryAverages.length - 1]?.[1] ?? '-'}).`,
    `Best speech: Day ${bestSpeech.day} — "${bestSpeech.topicText}" (${bestSpeech.scores?.overall}/100).`,
    `Most difficult topic: Day ${hardestTopic.day} — "${hardestTopic.topicText}" (${hardestTopic.scores?.overall}/100).`,
    `Overall improvement: ${overallImprovementPct >= 0 ? '+' : ''}${overallImprovementPct}%.`,
  ];
  let cursorY = y + 8;
  for (const line of doc.splitTextToSize(lines.join('\n'), pageWidth - 28)) {
    doc.text(line, 14, cursorY);
    cursorY += 6;
  }

  cursorY += 6;
  doc.setFontSize(12);
  doc.setTextColor(124, 58, 237);
  doc.text(
    `Your speaking ability improved from ${day1.scores?.overall ?? 0}/100 to ${day30.scores?.overall ?? 0}/100 over the 30-day challenge.`,
    14,
    cursorY,
    { maxWidth: pageWidth - 28 },
  );

  doc.save('speak60-30-day-report.pdf');
}
