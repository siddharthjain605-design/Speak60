import { useEffect, useState } from 'react';
import { getAudioBlob } from '../../lib/storage';
import { useStore } from '../../store';
import { Card, SectionTitle, SecondaryButton } from '../ui';

export default function AudioPlayback({
  attemptId, hasAudio, allowDelete = true,
}: {
  attemptId: string;
  hasAudio: boolean;
  allowDelete?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const deleteAttemptRecording = useStore((s) => s.deleteAttemptRecording);

  useEffect(() => {
    let objectUrl: string | null = null;
    setChecked(false);
    setUrl(null);
    if (hasAudio) {
      getAudioBlob(attemptId).then((blob) => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
        setChecked(true);
      });
    } else {
      setChecked(true);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attemptId, hasAudio]);

  if (!hasAudio) {
    return (
      <Card>
        <SectionTitle>Recording</SectionTitle>
        <p className="text-sm text-zinc-500">No audio was saved for this attempt.</p>
      </Card>
    );
  }

  if (checked && !url) {
    return (
      <Card>
        <SectionTitle>Recording</SectionTitle>
        <p className="text-sm text-zinc-500">
          A recording exists but isn't available on this device — audio is only ever stored locally on the
          device that made it, never uploaded.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionTitle>Recording</SectionTitle>
        {allowDelete && (
          <SecondaryButton
            onClick={async () => {
              if (confirm('Delete this recording permanently? The transcript and scores will be kept.')) {
                await deleteAttemptRecording(attemptId);
              }
            }}
          >
            Delete Recording
          </SecondaryButton>
        )}
      </div>
      {url ? <audio controls src={url} className="w-full" /> : <p className="text-sm text-zinc-500">Loading audio…</p>}
    </Card>
  );
}
