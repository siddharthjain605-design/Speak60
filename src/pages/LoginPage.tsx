import { useState } from 'react';
import { useAuthStore } from '../authStore';
import { Card, PrimaryButton } from '../components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink);
  const magicLinkSent = useAuthStore((s) => s.magicLinkSent);
  const authError = useAuthStore((s) => s.authError);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-sm text-center">
        <div className="mb-6">
          <div className="text-3xl font-bold text-white">Speak<span className="text-violet-400">60</span></div>
          <div className="mt-1 text-sm text-zinc-500">Think. Structure. Speak.</div>
        </div>

        {magicLinkSent ? (
          <div className="space-y-2">
            <p className="text-sm text-zinc-200">Check your inbox at</p>
            <p className="font-medium text-violet-300">{magicLinkSent}</p>
            <p className="text-xs text-zinc-500">Click the sign-in link we just sent to open Speak60.</p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) sendMagicLink(email.trim());
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500"
            />
            <PrimaryButton type="submit">Send me a sign-in link</PrimaryButton>
            {authError && <p className="text-xs text-rose-400">{authError}</p>}
            <p className="text-xs text-zinc-600">No password needed — we'll email you a one-click link.</p>
          </form>
        )}
      </Card>
    </div>
  );
}
