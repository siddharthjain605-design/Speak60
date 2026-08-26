import { PrimaryButton } from '../ui';
import type { Topic } from '../../types';
import { DIFFICULTY_LABELS } from '../../lib/topicEngine';

export default function NoResearchNotice({ topic, onContinue }: { topic: Topic; onContinue: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
      <div className="rounded-full bg-zinc-800 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
        {topic.category} · {DIFFICULTY_LABELS[topic.difficulty]}
      </div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">"{topic.text}"</h1>

      <div className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
        <div className="text-2xl font-extrabold tracking-tight text-rose-300">
          🔒 NO AI. NO GOOGLE. JUST YOU.
        </div>
        <p className="mt-3 text-sm text-rose-100/90">
          This challenge tests your existing knowledge, thinking ability and communication skills.
        </p>
        <p className="mt-2 text-sm text-rose-100/80">
          During the preparation period, you must not use ChatGPT, Google, AI tools, search engines,
          books or external research. Think independently and organise whatever you already know.
        </p>
      </div>

      <p className="max-w-lg text-sm text-zinc-400">
        The goal isn't a perfect factual answer — it's improving how you think under pressure, structure
        thoughts, recall what you know, and speak with confidence and clarity.
      </p>

      <PrimaryButton onClick={onContinue} className="text-lg">
        Start 10-Minute Preparation
      </PrimaryButton>
    </div>
  );
}
