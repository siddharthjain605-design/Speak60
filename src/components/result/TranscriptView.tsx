import { highlightTranscript } from '../../lib/speechAnalysis';
import { Card, SectionTitle } from '../ui';

export default function TranscriptView({ transcript, customFillerWords }: { transcript: string; customFillerWords: string[] }) {
  const tokens = highlightTranscript(transcript, customFillerWords);
  return (
    <Card>
      <SectionTitle sub="Filler words highlighted in amber, repeated words in rose. Nothing has been rewritten.">
        Your Speech — Original Transcript
      </SectionTitle>
      {transcript.trim().length === 0 ? (
        <p className="text-sm italic text-zinc-500">
          No speech was transcribed. Your browser may not support live transcription — try Chrome or Edge.
        </p>
      ) : (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-200">
          {tokens.map((t, i) =>
            t.isFiller ? (
              <span key={i} className="rounded bg-amber-500/20 px-0.5 text-amber-300">{t.text}</span>
            ) : t.isRepeat ? (
              <span key={i} className="rounded bg-rose-500/20 px-0.5 text-rose-300">{t.text}</span>
            ) : (
              <span key={i}>{t.text}</span>
            ),
          )}
        </p>
      )}
    </Card>
  );
}
