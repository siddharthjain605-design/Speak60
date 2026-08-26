export default function ProcessingStep() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-violet-500" />
      <div className="text-lg font-semibold text-white">Analysing your speech…</div>
      <p className="text-sm text-zinc-500">Transcribing, scoring fluency, and preparing your coaching feedback.</p>
    </div>
  );
}
