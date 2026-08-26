import { create } from 'zustand';
import type { Badge, ChallengeAttempt, DataState, RawTopic } from './types';
import { deleteAudioBlob, wipeAllAudio } from './lib/storage';
import * as db from './lib/db';
import { useAuthStore } from './authStore';

interface Store extends DataState {
  loadForUser: (userId: string) => Promise<void>;
  reset: () => void;
  saveAttempt: (attempt: ChallengeAttempt) => void;
  markTopicUsed: (topicId: string, date: string) => void;
  setTopicActive: (topicId: string, active: boolean) => void;
  addBadges: (badges: Badge[]) => void;
  addCustomTopics: (topics: RawTopic[]) => void;
  deleteAttemptRecording: (attemptId: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
}

const emptyState: DataState = { loaded: false, topicMeta: {}, attempts: [], badges: [], customTopics: [] };

function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

export const useStore = create<Store>((set, get) => ({
  ...emptyState,

  loadForUser: async (userId) => {
    set({ ...emptyState, loaded: false });
    const [attempts, usage, settings, customTopics, badges] = await Promise.all([
      db.fetchAttemptsForUser(userId),
      db.fetchTopicUsage(userId),
      db.fetchTopicSettings(),
      db.fetchCustomTopics(),
      db.fetchBadges(userId),
    ]);

    const topicMeta: DataState['topicMeta'] = {};
    for (const u of usage) {
      topicMeta[u.topic_id] = { active: true, lastUsedDate: u.last_used_date, timesUsed: u.times_used };
    }
    for (const s of settings) {
      const existing = topicMeta[s.topic_id] ?? { lastUsedDate: null, timesUsed: 0 };
      topicMeta[s.topic_id] = { ...existing, active: s.active };
    }

    set({ loaded: true, attempts, topicMeta, customTopics, badges });
  },

  reset: () => set({ ...emptyState }),

  saveAttempt: (attempt) => {
    const attempts = [...get().attempts];
    const idx = attempts.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) attempts[idx] = attempt;
    else attempts.push(attempt);
    set({ attempts });
    const userId = currentUserId();
    if (userId) db.upsertAttemptRemote(userId, attempt);
  },

  markTopicUsed: (topicId, date) => {
    const existing = get().topicMeta[topicId] ?? { active: true, lastUsedDate: null, timesUsed: 0 };
    const nextTimesUsed = existing.timesUsed + 1;
    set({ topicMeta: { ...get().topicMeta, [topicId]: { ...existing, lastUsedDate: date, timesUsed: nextTimesUsed } } });
    const userId = currentUserId();
    if (userId) db.markTopicUsedRemote(userId, topicId, date, nextTimesUsed);
  },

  setTopicActive: (topicId, active) => {
    const existing = get().topicMeta[topicId] ?? { active: true, lastUsedDate: null, timesUsed: 0 };
    set({ topicMeta: { ...get().topicMeta, [topicId]: { ...existing, active } } });
    db.setTopicActiveRemote(topicId, active);
  },

  addBadges: (badges) => {
    if (badges.length === 0) return;
    set({ badges: [...get().badges, ...badges] });
    const userId = currentUserId();
    if (userId) db.addBadgesRemote(userId, badges);
  },

  addCustomTopics: (topics) => {
    if (topics.length === 0) return;
    set({ customTopics: [...get().customTopics, ...topics] });
    const userId = currentUserId();
    if (userId) db.addCustomTopicsRemote(userId, topics);
  },

  deleteAttemptRecording: async (attemptId) => {
    await deleteAudioBlob(attemptId);
    const attempts = get().attempts.map((a) => (a.id === attemptId ? { ...a, hasAudio: false } : a));
    set({ attempts });
    const userId = currentUserId();
    const updated = attempts.find((a) => a.id === attemptId);
    if (userId && updated) db.upsertAttemptRemote(userId, updated);
  },

  deleteAllData: async () => {
    const userId = currentUserId();
    await wipeAllAudio();
    if (userId) await db.deleteAllAttemptsForUser(userId);
    set({ ...emptyState, loaded: true });
  },
}));
