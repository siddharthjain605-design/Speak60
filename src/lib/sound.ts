// Lightweight synthesized sound effects via WebAudio — no binary asset files needed.

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

function noiseBurst(startOffset: number, duration: number, gainPeak: number, filterFreq: number) {
  const ctx = getCtx();
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(gainPeak, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(t0);
  source.stop(t0 + duration + 0.02);
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType, gainPeak: number) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playBeep() {
  tone(880, 0, 0.15, 'sine', 0.2);
}

export function playUrgentBeep() {
  tone(660, 0, 0.1, 'square', 0.15);
  tone(880, 0.12, 0.12, 'square', 0.15);
}

export function playCountdownTick() {
  tone(440, 0, 0.08, 'sine', 0.18);
}

export function playGo() {
  tone(523.25, 0, 0.12, 'sine', 0.22);
  tone(783.99, 0.13, 0.2, 'sine', 0.22);
}

/** Slot-machine reel tick. Pitch rises as the reel slows, building tension. */
export function playReelTick(progress = 0) {
  const freq = 260 + progress * 320;
  tone(freq, 0, 0.03, 'square', 0.05);
}

/** Continuous low rumble while the reel spins, cinematic build-up. Call the returned fn to stop. */
export function startRumble(): () => void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 55;
  lfo.frequency.value = 5.5;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  lfo.start();
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const t = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.stop(t + 0.35);
    lfo.stop(t + 0.35);
  };
}

export function playLockIn() {
  tone(392, 0, 0.1, 'sine', 0.2);
  tone(523.25, 0.1, 0.1, 'sine', 0.2);
  tone(659.25, 0.2, 0.25, 'sine', 0.25);
}

/** Big triumphant chord cluster for the topic-lock / results moments. */
export function playFanfare() {
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((f, i) => tone(f, i * 0.03, 0.5, 'triangle', 0.16));
  tone(1567.98, 0.32, 0.35, 'sine', 0.12);
}

/** Quick twinkle used alongside a confetti burst. */
export function playSparkle() {
  [1318.5, 1567.98, 1864.66, 2093].forEach((f, i) => tone(f, i * 0.05, 0.18, 'sine', 0.08));
}

export function playChime() {
  tone(1046.5, 0, 0.3, 'sine', 0.2);
}

/** Distinct rising arpeggio for "achievement unlocked" moments. */
export function playBadgeUnlock() {
  [440, 554.37, 659.25, 880].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle', 0.18));
}

/** Very short, quiet tick used for animated number count-ups. */
export function playScoreTick() {
  tone(700, 0, 0.02, 'square', 0.03);
}

/** KBC/game-show style drumroll — accelerating low hits, call before a big reveal. */
export function playDrumroll(durationMs: number): void {
  getCtx();
  const totalSec = durationMs / 1000;
  let t = 0;
  let interval = 0.14;
  while (t < totalSec) {
    noiseBurst(t, 0.05, 0.12, 180);
    t += interval;
    interval = Math.max(0.04, interval * 0.93);
  }
}

/** Big cymbal-crash + horn stab for the theatrical reveal moment. */
export function playCrashSting(): void {
  noiseBurst(0, 0.9, 0.16, 6000);
  [261.6, 329.6, 392, 523.25].forEach((f, i) => tone(f, 0.02, 0.7, 'sawtooth', 0.1 - i * 0.01));
  tone(1046.5, 0.05, 0.5, 'sine', 0.1);
}
