import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';

export interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
  challenge_start_date: string | null;
  custom_filler_words: string[];
  privacy_acknowledged: boolean;
}

interface AuthStore {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  authError: string | null;
  magicLinkSent: string | null;
  init: () => void;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (partial: Partial<Pick<Profile, 'display_name' | 'custom_filler_words' | 'privacy_acknowledged' | 'challenge_start_date'>>) => Promise<void>;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  // The DB trigger that creates a profile row fires asynchronously on signup;
  // retry briefly in case we ask before it lands.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) return data as Profile;
    if (error) break;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  initialized: false,
  session: null,
  user: null,
  profile: null,
  authError: null,
  magicLinkSent: null,

  init: () => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session ?? null;
      const profile = session ? await fetchProfile(session.user.id) : null;
      set({ session, user: session?.user ?? null, profile, initialized: true });
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session ? await fetchProfile(session.user.id) : null;
      set({ session, user: session?.user ?? null, profile, initialized: true });
    });
  },

  sendMagicLink: async (email) => {
    set({ authError: null, magicLinkSent: null });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) set({ authError: error.message });
    else set({ magicLinkSent: email });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  refreshProfile: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    const profile = await fetchProfile(userId);
    set({ profile });
  },

  updateProfile: async (partial) => {
    const userId = get().user?.id;
    if (!userId) return;
    const current = get().profile;
    if (current) set({ profile: { ...current, ...partial } });
    await supabase.from('profiles').update(partial).eq('id', userId);
  },
}));
