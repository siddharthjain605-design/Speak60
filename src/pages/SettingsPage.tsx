import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import { Card, PrimaryButton, SecondaryButton, SectionTitle, Pill } from '../components/ui';

export default function SettingsPage() {
  const store = useStore();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const [name, setName] = useState(profile?.display_name ?? '');
  const [newFiller, setNewFiller] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  const customFillerWords = profile?.custom_filler_words ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Card>
        <SectionTitle sub={user?.email ?? undefined}>Profile</SectionTitle>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
          <SecondaryButton onClick={() => updateProfile({ display_name: name })}>Save</SecondaryButton>
        </div>
        <button onClick={() => signOut()} className="mt-3 text-xs font-medium text-zinc-500 hover:text-rose-400">
          Sign out
        </button>
      </Card>

      <Card>
        <SectionTitle sub="Add words or phrases (e.g. local expressions) that should also count as fillers when scoring your speech.">
          Custom Filler Words
        </SectionTitle>
        <div className="mb-3 flex flex-wrap gap-2">
          {customFillerWords.map((w) => (
            <Pill key={w}>
              {w}{' '}
              <button
                className="ml-1 text-zinc-500 hover:text-rose-400"
                onClick={() => updateProfile({ custom_filler_words: customFillerWords.filter((x) => x !== w) })}
              >
                ×
              </button>
            </Pill>
          ))}
          {customFillerWords.length === 0 && <span className="text-xs text-zinc-600">None added yet.</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={newFiller}
            onChange={(e) => setNewFiller(e.target.value)}
            placeholder="e.g. matlab, na, toh"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
          <SecondaryButton
            onClick={() => {
              const w = newFiller.trim().toLowerCase();
              if (w && !customFillerWords.includes(w)) {
                updateProfile({ custom_filler_words: [...customFillerWords, w] });
              }
              setNewFiller('');
            }}
          >
            Add
          </SecondaryButton>
        </div>
      </Card>

      <Card>
        <SectionTitle>Privacy</SectionTitle>
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            Your microphone is only accessed when you press "Start Speaking," and only for the duration of a
            recording. Speak60 requests explicit browser microphone permission before recording.
          </p>
          <p>
            <strong className="text-zinc-200">What's stored where:</strong> audio recordings are saved locally
            in this browser's storage (IndexedDB) on this device only — they are never uploaded. Transcripts,
            metrics, scores, and coaching feedback sync to your family's shared account so progress can be
            tracked centrally. Live transcription runs entirely inside your browser via its built-in speech
            recognition — no third-party AI service is called.
          </p>
          <p>
            <strong className="text-zinc-200">Who can see your data:</strong> you, and the account administrator
            for this family group.
          </p>
          <p>
            <strong className="text-zinc-200">Your controls:</strong> delete any single recording from its
            result page, or wipe everything below.
          </p>
        </div>
      </Card>

      <Card className="border-rose-500/30">
        <SectionTitle>Delete My Speaking Data</SectionTitle>
        <p className="mb-3 text-sm text-zinc-400">
          This permanently deletes every recording, transcript, score, and your challenge history. This cannot
          be undone. Your account and login stay active.
        </p>
        {!confirmWipe ? (
          <SecondaryButton onClick={() => setConfirmWipe(true)} className="border-rose-500/50 text-rose-300">
            Delete My Speaking Data
          </SecondaryButton>
        ) : (
          <div className="flex gap-2">
            <PrimaryButton
              className="bg-rose-600 hover:bg-rose-500"
              onClick={async () => {
                await store.deleteAllData();
                navigate('/');
              }}
            >
              Confirm — Delete Everything
            </PrimaryButton>
            <SecondaryButton onClick={() => setConfirmWipe(false)}>Cancel</SecondaryButton>
          </div>
        )}
      </Card>
    </div>
  );
}
