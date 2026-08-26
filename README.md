# Speak60 — Think. Structure. Speak.

A daily 1-minute spontaneous-speaking challenge: draw a random topic, prepare
for 10 minutes with no outside help, speak for 60 seconds, and get an
objective, consistent breakdown of how you did.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL in **Chrome or Edge** (see "Browser support" below).
Microphone access is requested only when you press "Start Speaking."

```bash
npm run build   # type-checks + production build
npm run lint    # oxlint
```

## What's implemented

- **1,008-topic bank** across all 48 categories from the spec (History, AI,
  Ethics, Cricket, Abstract Topics, etc.), each tagged with category,
  subcategory, difficulty (1–5), and type (knowledge/opinion/abstract/
  hypothetical). Manage it at `/topics` — search, activate/deactivate, add
  topics manually, import/export CSV.
- **Casino-style topic draw** with a genuinely random (crypto-backed) pick
  that locks in and persists for the day — refreshing never redraws.
- **No-repeat pool**: a topic won't reappear until every active topic in the
  relevant pool has been used once.
- **10-minute prep timer** with a manual scratchpad and a static (never
  auto-filled) Opening/Points/Example/Conclusion prompt, audible alerts at
  5m/2m/1m/30s/10s.
- **3-2-1 countdown → 60s recording** via `MediaRecorder`, with live
  transcription via the browser's built-in Speech Recognition API.
- **Deterministic scoring engine** (`src/lib/scoringEngine.ts`) — every score
  is computed the same way from measured metrics, versioned as
  `RUBRIC_VERSION`, so Day 1 and Day 30 stay comparable even if the app is
  later upgraded (spec §25).
- **Objective metrics** from two independent pipelines: transcript analysis
  (WPM, fillers, repetition, vocabulary variety, incomplete sentences) and
  real audio DSP via the Web Audio API (pause detection, volume consistency,
  pace consistency, a pitch-range estimate via autocorrelation).
- **Rule-based coach feedback** — strengths/weaknesses/one focus area for
  tomorrow, plus a template "how this could have been structured" example,
  all derived from the measured metrics, never shown before you finish
  speaking.
- **Calendar-based 30-day challenge** (`/calendar`) — Day 1 is set the first
  time you draw a Daily Challenge topic; missed calendar days show as
  "Missed," not just skipped.
- **Progress dashboard** (`/progress`) with trend charts (Recharts) for every
  metric in the spec, plus topic-category performance.
- **30-Day Report** (`/report`) with Day-1-vs-Day-30 and first-5-vs-last-5
  comparisons, biggest improvement, most common fillers, strongest/weakest
  categories, best speech, hardest topic, and a downloadable PDF
  (`jsPDF` + `jspdf-autotable`).
- **Practice Mode** (`/practice`) — unlimited topics by difficulty or
  category, kept fully separate from Daily Challenge stats.
- **Gamification**: streaks, personal best, Filler Killer, Zero-Long-Pause,
  100/120 WPM Club, Most Improved, Consistency Award.
- **Privacy controls** (`/settings`): what's stored and where, delete a
  single recording, or wipe all local data.

## Architecture

Each engine from the spec is its own module under `src/lib/`:

| Module | Responsibility |
|---|---|
| `topicEngine.ts` | Topic selection, no-repeat pool, difficulty progression |
| `speechAnalysis.ts` | Transcript-derived metrics (WPM, fillers, structure signals) |
| `audioAnalysis.ts` | Web Audio DSP (pauses, volume, pace, pitch) |
| `scoringEngine.ts` | The versioned rubric — pure function of metrics → scores |
| `coachFeedback.ts` | Rule-based qualitative feedback from the scored metrics |
| `badges.ts` | Gamification rules |
| `pdfReport.ts` | 30-day PDF generation |
| `storage.ts` | Persistence layer (see below) |

`ChallengeFlow.tsx` is the state machine for the single linear journey:
draw → no-research notice → prep → speak → processing → result — shared by
both Daily Challenge and Practice Mode.

## Where this build simplifies the original spec

This runs entirely client-side with **no backend**, so a few pieces are
pragmatic stand-ins rather than the enterprise-scale versions described in
the spec. They're deliberately isolated so swapping in the real thing later
doesn't require restructuring the app:

- **No Postgres/Supabase, no accounts.** Everything persists in the
  browser: structured data (attempts, scores, topic bank state, settings) in
  `localStorage`, and raw audio recordings in `IndexedDB` — kept in separate
  stores on purpose, per spec §24. This means data is per-browser, not
  synced across devices. `storage.ts` is the one file you'd swap for a real
  database.
- **No LLM API call.** "AI Coach Feedback" and scoring are **rule-based and
  deterministic**, computed straight from measured metrics — which is
  actually what spec §25 asks for ("do not allow scores to vary arbitrarily
  day to day"). A real LLM call could slot into `coachFeedback.ts` for the
  qualitative "improved version" text alone, without touching the scoring
  rubric.
- **Speech-to-text is the browser's built-in engine**
  (`webkitSpeechRecognition`), not a paid cloud STT API — free, but only
  available in Chromium-based browsers (Chrome, Edge). Firefox/Safari will
  still record audio, just without live transcription.
- **Pitch/voice metrics are lightweight DSP heuristics** (autocorrelation
  pitch tracking, RMS-based volume/pause detection) computed in-browser —
  explicitly labeled in the UI as communication-performance indicators, not
  clinical measurements, per spec §8D.

## Browser support

Recording works in any modern browser. Live transcription (and therefore
transcript-based scoring) requires the Web Speech API, currently
Chrome/Edge only.
