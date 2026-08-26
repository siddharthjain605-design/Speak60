import type { ChallengeAttempt } from '../types';

const DB_NAME = 'speak60_audio';
const DB_STORE = 'recordings';

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTodaysDailyAttempt(attempts: ChallengeAttempt[]): ChallengeAttempt | null {
  const today = todayISO();
  return attempts.find((a) => a.isDailyChallenge && a.date === today) ?? null;
}

export function getDailyAttempts(attempts: ChallengeAttempt[]): ChallengeAttempt[] {
  return attempts
    .filter((a) => a.isDailyChallenge && a.status === 'completed')
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
}

/**
 * Calendar-based day index (1..30+) counted from the date the very first
 * Daily Challenge topic was drawn. This is what makes a "Missed" day in the
 * 30-day calendar meaningful — a date the user simply never showed up for,
 * not just a gap in a completion counter.
 */
export function getChallengeDayNumber(challengeStartDate: string | null, dateISO: string): number {
  if (!challengeStartDate) return 1;
  const start = new Date(`${challengeStartDate}T00:00:00Z`).getTime();
  const date = new Date(`${dateISO}T00:00:00Z`).getTime();
  const diffDays = Math.round((date - start) / 86400000);
  return diffDays + 1;
}

export function dateForChallengeDay(challengeStartDate: string | null, day: number): string {
  const start = challengeStartDate ?? todayISO();
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (day - 1));
  return d.toISOString().slice(0, 10);
}

// --- IndexedDB audio blob store — local to this device, never synced. ---

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAudioBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAudioBlob(key: string): Promise<Blob | null> {
  const db = await openDb();
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function deleteAudioBlob(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function wipeAllAudio(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
