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

export function playReelTick() {
  tone(300, 0, 0.03, 'square', 0.05);
}

export function playLockIn() {
  tone(392, 0, 0.1, 'sine', 0.2);
  tone(523.25, 0.1, 0.1, 'sine', 0.2);
  tone(659.25, 0.2, 0.25, 'sine', 0.25);
}

export function playChime() {
  tone(1046.5, 0, 0.3, 'sine', 0.2);
}
