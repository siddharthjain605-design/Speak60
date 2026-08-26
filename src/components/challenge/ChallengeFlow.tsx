import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useAuthStore } from '../../authStore';
import { drawTopic, getAllTopics, type DrawOptions } from '../../lib/topicEngine';
import { todayISO, saveAudioBlob, getChallengeDayNumber, getDailyAttempts } from '../../lib/storage';
import { analyzeAudioBlob } from '../../lib/audioAnalysis';
import { analyzeTranscript } from '../../lib/speechAnalysis';
import { computeScores } from '../../lib/scoringEngine';
import { generateCoachFeedback } from '../../lib/coachFeedback';
import { evaluateNewBadges } from '../../lib/badges';
import type { ChallengeAttempt, Topic, TopicType, Difficulty } from '../../types';
import TopicReel from '../draw/TopicReel';
import NoResearchNotice from './NoResearchNotice';
import PrepStep from './PrepStep';
import SpeakStep, { type SpeakResult } from './SpeakStep';
import ProcessingStep from './ProcessingStep';
import { PrimaryButton } from '../ui';

type Step = 'draw' | 'spin' | 'notice' | 'prep' | 'speak' | 'processing';

export const MAX_TRIAL_RUNS = 3;
const SPEAK_SECONDS_BEFORE_GRADUATION = 180; // 3 minutes, during the first 30 days
const SPEAK_SECONDS_AFTER_GRADUATION = 600; // 10 minutes, once the 30-day challenge is complete

interface ChallengeFlowProps {
  mode: 'daily' | 'practice' | 'trial';
  practiceFilter?: { category?: string; difficulty?: Difficulty; type?: TopicType };
}

function newAttemptId(): string {
  return `atmpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChallengeFlow({ mode, practiceFilter }: ChallengeFlowProps) {
  const navigate = useNavigate();
  const store = useStore();
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [step, setStep] = useState<Step>('draw');
  const [attempt, setAttempt] = useState<ChallengeAttempt | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);

  const allTopics = useMemo(() => getAllTopics(store), [store]);
  const maxSpeakSeconds = getDailyAttempts(store.attempts).length >= 30
    ? SPEAK_SECONDS_AFTER_GRADUATION
    : SPEAK_SECONDS_BEFORE_GRADUATION;

  useEffect(() => {
    if (mode !== 'daily') return;
    const today = todayISO();
    const existing = store.attempts.find((a) => a.isDailyChallenge && a.date === today && a.status !== 'completed');
    if (existing) {
      const t = allTopics.find((tp) => tp.id === existing.topicId);
      if (t) {
        setAttempt(existing);
        setTopic(t);
        setStep('notice');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const reelPool = useMemo(() => {
    let pool = allTopics.filter((t) => t.active);
    if (practiceFilter?.category) pool = pool.filter((t) => t.category === practiceFilter.category);
    if (practiceFilter?.type) pool = pool.filter((t) => t.type === practiceFilter.type);
    return pool.length > 0 ? pool : allTopics;
  }, [allTopics, practiceFilter]);

  function handleDraw() {
    const today = todayISO();
    let day: number | null = null;
    if (mode === 'daily') {
      if (!profile?.challenge_start_date) {
        updateProfile({ challenge_start_date: today });
        day = 1;
      } else {
        day = getChallengeDayNumber(profile.challenge_start_date, today);
      }
    }

    if (mode === 'trial') {
      const used = profile?.trial_runs_used ?? 0;
      if (used >= MAX_TRIAL_RUNS) return;
      updateProfile({ trial_runs_used: used + 1 });
    }

    const opts: DrawOptions = {};
    if (mode === 'daily') opts.day = day ?? 1;
    if (practiceFilter?.category) opts.category = practiceFilter.category;
    if (practiceFilter?.difficulty) opts.difficulty = [practiceFilter.difficulty];
    if (practiceFilter?.type) opts.type = practiceFilter.type;

    const drawn = drawTopic(store, opts);
    const id = newAttemptId();
    const newAttempt: ChallengeAttempt = {
      id,
      isDailyChallenge: mode === 'daily',
      day,
      date: today,
      topicId: drawn.id,
      topicText: drawn.text,
      topicCategory: drawn.category,
      topicDifficulty: drawn.difficulty,
      scratchpad: '',
      prepStart: null,
      prepEnd: null,
      speechStart: null,
      speechEnd: null,
      transcriptRaw: '',
      transcriptSegments: [],
      metrics: null,
      scores: null,
      coach: null,
      hasAudio: false,
      status: 'in_progress',
    };
    setTopic(drawn);
    setAttempt(newAttempt);
    store.saveAttempt(newAttempt);
    store.markTopicUsed(drawn.id, today);
    setStep('spin');
  }

  function handleLocked() {
    setStep('notice');
  }

  function handleNoticeContinue() {
    if (!attempt) return;
    const updated = { ...attempt, prepStart: new Date().toISOString() };
    setAttempt(updated);
    store.saveAttempt(updated);
    setStep('prep');
  }

  function handleScratchpadChange(v: string) {
    if (!attempt) return;
    setAttempt({ ...attempt, scratchpad: v });
  }

  function handlePrepComplete() {
    if (!attempt) return;
    const updated = { ...attempt, prepEnd: new Date().toISOString() };
    setAttempt(updated);
    store.saveAttempt(updated);
    setStep('speak');
  }

  async function handleSpeakComplete(result: SpeakResult) {
    if (!attempt || !topic) return;
    setStep('processing');
    const speechEnd = new Date().toISOString();

    let audioFeatures = null;
    if (result.blob && result.blob.size > 0) {
      try {
        const wordTimings = result.segments.map((s) => ({
          startSec: s.startSec,
          endSec: s.endSec,
          wordCount: s.text.trim().split(/\s+/).filter(Boolean).length,
        }));
        audioFeatures = await analyzeAudioBlob(result.blob, wordTimings);
      } catch {
        audioFeatures = null;
      }
    }

    const durationSec = audioFeatures?.durationSec ?? result.durationSec;
    const metrics = analyzeTranscript({
      transcript: result.transcript,
      segments: result.segments,
      durationSec,
      customFillerWords: profile?.custom_filler_words ?? [],
      audioPauses: audioFeatures?.pauses,
      volumeConsistencyPct: audioFeatures?.volumeConsistencyPct,
      paceConsistencyPct: audioFeatures?.paceConsistencyPct,
      pitchRangeHz: audioFeatures?.pitchRangeHz ?? null,
      pitchVariationPct: audioFeatures?.pitchVariationPct,
    });
    const scores = computeScores(metrics, result.transcript, topic.text);
    const coach = generateCoachFeedback(metrics, scores, topic.text, result.transcript);

    let hasAudio = false;
    if (result.blob && result.blob.size > 0) {
      try {
        await saveAudioBlob(attempt.id, result.blob);
        hasAudio = true;
      } catch {
        hasAudio = false;
      }
    }

    const completed: ChallengeAttempt = {
      ...attempt,
      speechStart: attempt.prepEnd,
      speechEnd,
      transcriptRaw: result.transcript,
      transcriptSegments: result.segments,
      metrics,
      scores,
      coach,
      hasAudio,
      status: 'completed',
    };
    store.saveAttempt(completed);
    const badges = evaluateNewBadges(store, completed);
    store.addBadges(badges);
    navigate(`/result/${completed.id}`, { state: { newBadges: badges } });
  }

  if (step === 'draw') {
    const trialRemaining = MAX_TRIAL_RUNS - (profile?.trial_runs_used ?? 0);
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">
          {mode === 'daily' ? "Ready for today's challenge?" : mode === 'trial' ? 'Try a trial run' : 'Draw a practice topic'}
        </h1>
        <p className="text-sm text-zinc-500">
          A topic will be drawn at random and locked in{mode === 'daily' ? ' for today' : ''}.
          {mode === 'daily' && ' Refreshing the page will not draw a new one.'}
          {mode === 'trial' && ' This runs through the full experience — prep timer, recording, and analysis — with zero pressure.'}
        </p>
        {mode === 'trial' && (
          <p className="text-xs text-amber-400">{trialRemaining} of {MAX_TRIAL_RUNS} trial run(s) remaining</p>
        )}
        <PrimaryButton onClick={handleDraw} disabled={mode === 'trial' && trialRemaining <= 0} className="buzzer-btn px-12 py-6 text-2xl">
          {mode === 'daily' ? "DRAW TODAY'S TOPIC" : mode === 'trial' ? 'DRAW A TRIAL TOPIC' : 'DRAW A TOPIC'}
        </PrimaryButton>
      </div>
    );
  }

  if (step === 'spin' && topic) {
    return <TopicReel pool={reelPool} finalTopic={topic} onLocked={handleLocked} />;
  }

  if (step === 'notice' && topic) {
    return <NoResearchNotice topic={topic} onContinue={handleNoticeContinue} />;
  }

  if (step === 'prep' && topic && attempt) {
    return (
      <PrepStep
        topic={topic}
        scratchpad={attempt.scratchpad}
        onScratchpadChange={handleScratchpadChange}
        onComplete={handlePrepComplete}
      />
    );
  }

  if (step === 'speak' && topic && attempt) {
    return (
      <SpeakStep
        topic={topic}
        scratchpad={attempt.scratchpad}
        maxSpeakSeconds={maxSpeakSeconds}
        onComplete={handleSpeakComplete}
      />
    );
  }

  if (step === 'processing') {
    return <ProcessingStep />;
  }

  return null;
}
