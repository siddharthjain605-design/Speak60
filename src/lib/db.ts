import { supabase } from './supabaseClient';
import type { Badge, ChallengeAttempt, RawTopic } from '../types';

interface AttemptRow {
  id: string;
  user_id: string;
  is_daily_challenge: boolean;
  day: number | null;
  date: string;
  topic_id: string;
  topic_text: string;
  topic_category: string;
  topic_difficulty: number;
  scratchpad: string;
  prep_start: string | null;
  prep_end: string | null;
  speech_start: string | null;
  speech_end: string | null;
  transcript_raw: string;
  transcript_segments: ChallengeAttempt['transcriptSegments'];
  metrics: ChallengeAttempt['metrics'];
  scores: ChallengeAttempt['scores'];
  coach: ChallengeAttempt['coach'];
  has_audio: boolean;
  status: ChallengeAttempt['status'];
}

function rowToAttempt(row: AttemptRow): ChallengeAttempt {
  return {
    id: row.id,
    isDailyChallenge: row.is_daily_challenge,
    day: row.day,
    date: row.date,
    topicId: row.topic_id,
    topicText: row.topic_text,
    topicCategory: row.topic_category,
    topicDifficulty: row.topic_difficulty as ChallengeAttempt['topicDifficulty'],
    scratchpad: row.scratchpad,
    prepStart: row.prep_start,
    prepEnd: row.prep_end,
    speechStart: row.speech_start,
    speechEnd: row.speech_end,
    transcriptRaw: row.transcript_raw,
    transcriptSegments: row.transcript_segments ?? [],
    metrics: row.metrics,
    scores: row.scores,
    coach: row.coach,
    hasAudio: row.has_audio,
    status: row.status,
  };
}

function attemptToRow(userId: string, a: ChallengeAttempt) {
  return {
    id: a.id,
    user_id: userId,
    is_daily_challenge: a.isDailyChallenge,
    day: a.day,
    date: a.date,
    topic_id: a.topicId,
    topic_text: a.topicText,
    topic_category: a.topicCategory,
    topic_difficulty: a.topicDifficulty,
    scratchpad: a.scratchpad,
    prep_start: a.prepStart,
    prep_end: a.prepEnd,
    speech_start: a.speechStart,
    speech_end: a.speechEnd,
    transcript_raw: a.transcriptRaw,
    transcript_segments: a.transcriptSegments,
    metrics: a.metrics,
    scores: a.scores,
    coach: a.coach,
    has_audio: a.hasAudio,
    status: a.status,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAttemptsForUser(userId: string): Promise<ChallengeAttempt[]> {
  const { data, error } = await supabase.from('attempts').select('*').eq('user_id', userId);
  if (error || !data) return [];
  return (data as AttemptRow[]).map(rowToAttempt);
}

export async function fetchAllAttempts(): Promise<Record<string, ChallengeAttempt[]>> {
  const { data, error } = await supabase.from('attempts').select('*');
  if (error || !data) return {};
  const byUser: Record<string, ChallengeAttempt[]> = {};
  for (const row of data as AttemptRow[]) {
    byUser[row.user_id] = byUser[row.user_id] ?? [];
    byUser[row.user_id].push(rowToAttempt(row));
  }
  return byUser;
}

export async function upsertAttemptRemote(userId: string, attempt: ChallengeAttempt): Promise<void> {
  const { error } = await supabase.from('attempts').upsert(attemptToRow(userId, attempt));
  if (error) console.error('Failed to sync attempt to Supabase:', error.message);
}

export async function deleteAttemptRemote(attemptId: string): Promise<string | null> {
  const { error } = await supabase.from('attempts').delete().eq('id', attemptId);
  return error?.message ?? null;
}

export async function deleteAllAttemptsForUser(userId: string): Promise<void> {
  await supabase.from('attempts').delete().eq('user_id', userId);
}

export interface TopicUsageRow {
  topic_id: string;
  last_used_date: string | null;
  times_used: number;
}

export async function fetchTopicUsage(userId: string): Promise<TopicUsageRow[]> {
  const { data, error } = await supabase.from('topic_usage').select('topic_id,last_used_date,times_used').eq('user_id', userId);
  if (error || !data) return [];
  return data as TopicUsageRow[];
}

export async function markTopicUsedRemote(userId: string, topicId: string, date: string, nextTimesUsed: number): Promise<void> {
  await supabase.from('topic_usage').upsert({
    user_id: userId,
    topic_id: topicId,
    last_used_date: date,
    times_used: nextTimesUsed,
  });
}

export interface TopicSettingRow {
  topic_id: string;
  active: boolean;
}

export async function fetchTopicSettings(): Promise<TopicSettingRow[]> {
  const { data, error } = await supabase.from('topic_settings').select('*');
  if (error || !data) return [];
  return data as TopicSettingRow[];
}

export async function setTopicActiveRemote(topicId: string, active: boolean): Promise<void> {
  await supabase.from('topic_settings').upsert({ topic_id: topicId, active });
}

export async function fetchCustomTopics(): Promise<RawTopic[]> {
  const { data, error } = await supabase.from('custom_topics').select('text,category,subcategory,difficulty,type');
  if (error || !data) return [];
  return data as RawTopic[];
}

export async function addCustomTopicsRemote(userId: string, topics: RawTopic[]): Promise<void> {
  await supabase.from('custom_topics').insert(
    topics.map((t) => ({ ...t, created_by: userId })),
  );
}

export async function fetchBadges(userId: string): Promise<Badge[]> {
  const { data, error } = await supabase.from('badges').select('badge_id,name,description,earned_at').eq('user_id', userId);
  if (error || !data) return [];
  return (data as { badge_id: string; name: string; description: string; earned_at: string }[]).map((b) => ({
    id: b.badge_id,
    name: b.name,
    description: b.description,
    earnedAt: b.earned_at,
  }));
}

export async function addBadgesRemote(userId: string, badges: Badge[]): Promise<void> {
  await supabase.from('badges').insert(
    badges.map((b) => ({ user_id: userId, badge_id: b.id, name: b.name, description: b.description })),
  );
}

export interface FamilyMemberSummary {
  id: string;
  displayName: string;
  challengeStartDate: string | null;
  customFillerWords: string[];
}

export async function fetchAllProfiles(): Promise<FamilyMemberSummary[]> {
  const { data, error } = await supabase.from('profiles').select('id,display_name,challenge_start_date,custom_filler_words');
  if (error || !data) return [];
  return (data as { id: string; display_name: string; challenge_start_date: string | null; custom_filler_words: string[] }[]).map((p) => ({
    id: p.id,
    displayName: p.display_name,
    challengeStartDate: p.challenge_start_date,
    customFillerWords: p.custom_filler_words ?? [],
  }));
}

export async function fetchAttemptById(id: string): Promise<ChallengeAttempt | null> {
  const { data, error } = await supabase.from('attempts').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToAttempt(data as AttemptRow);
}

/** Admin-only: edit another family member's profile (display name, challenge start date, etc). */
export async function updateProfileRemote(
  userId: string,
  partial: { display_name?: string; challenge_start_date?: string | null; custom_filler_words?: string[] },
): Promise<string | null> {
  const { error } = await supabase.from('profiles').update(partial).eq('id', userId);
  return error?.message ?? null;
}
