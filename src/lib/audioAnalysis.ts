// Objective audio-delivery features computed from the raw recording using the
// Web Audio API. These are communication-performance indicators, not medical
// or scientifically calibrated measurements — always presented that way in the UI.

export interface AudioFeatures {
  pauses: { count: number; avgSec: number; longestSec: number };
  volumeConsistencyPct: number;
  paceConsistencyPct: number;
  pitchRangeHz: [number, number] | null;
  pitchVariationPct: number;
  durationSec: number;
}

function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function decimate(data: Float32Array, factor: number): Float32Array {
  const out = new Float32Array(Math.floor(data.length / factor));
  for (let i = 0; i < out.length; i++) out[i] = data[i * factor];
  return out;
}

function autocorrelationPitch(frame: Float32Array, sampleRate: number, minHz = 80, maxHz = 400): number | null {
  const maxLag = Math.floor(sampleRate / minHz);
  const minLag = Math.floor(sampleRate / maxHz);
  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag && lag < frame.length; lag++) {
    let corr = 0;
    for (let i = 0; i < frame.length - lag; i++) {
      corr += frame[i] * frame[i + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag <= 0) return null;
  return sampleRate / bestLag;
}

export async function analyzeAudioBlob(
  blob: Blob,
  wordTimings: { startSec: number; endSec: number; wordCount: number }[],
): Promise<AudioFeatures> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close();
  }

  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const durationSec = audioBuffer.duration;

  // --- Pause detection: 100ms RMS windows ---
  const windowSec = 0.1;
  const windowSize = Math.floor(sampleRate * windowSec);
  const rmsSeries: number[] = [];
  for (let i = 0; i + windowSize <= data.length; i += windowSize) {
    rmsSeries.push(rms(data.subarray(i, i + windowSize)));
  }
  const maxRms = Math.max(...rmsSeries, 1e-6);
  const silenceThreshold = maxRms * 0.08;

  const voiced = rmsSeries.filter((v) => v > silenceThreshold);
  const meanVoiced = voiced.length > 0 ? voiced.reduce((a, b) => a + b, 0) / voiced.length : 0;
  const varVoiced = voiced.length > 0
    ? voiced.reduce((a, b) => a + (b - meanVoiced) ** 2, 0) / voiced.length
    : 0;
  const stdVoiced = Math.sqrt(varVoiced);
  const coefVar = meanVoiced > 0 ? stdVoiced / meanVoiced : 0;
  const volumeConsistencyPct = Math.round(Math.max(0, Math.min(100, 100 - coefVar * 100)));

  let pauseCount = 0;
  const pauseDurations: number[] = [];
  let currentPauseLen = 0;
  const minLongPauseSec = 0.6;
  for (const v of rmsSeries) {
    if (v <= silenceThreshold) {
      currentPauseLen += windowSec;
    } else {
      if (currentPauseLen >= minLongPauseSec) {
        pauseCount++;
        pauseDurations.push(currentPauseLen);
      }
      currentPauseLen = 0;
    }
  }
  if (currentPauseLen >= minLongPauseSec) {
    pauseCount++;
    pauseDurations.push(currentPauseLen);
  }
  const avgSec = pauseDurations.length > 0
    ? Math.round((pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length) * 10) / 10
    : 0;
  const longestSec = pauseDurations.length > 0 ? Math.round(Math.max(...pauseDurations) * 10) / 10 : 0;

  // --- Pitch estimate on a downsampled signal for speed ---
  const targetRate = 8000;
  const decimationFactor = Math.max(1, Math.round(sampleRate / targetRate));
  const downsampled = decimate(data, decimationFactor);
  const effectiveRate = sampleRate / decimationFactor;
  const frameSize = 512;
  const hop = 256;
  const pitches: number[] = [];
  for (let i = 0; i + frameSize <= downsampled.length; i += hop) {
    const frame = downsampled.subarray(i, i + frameSize);
    const frameRms = rms(frame);
    if (frameRms < silenceThreshold * 0.6) continue;
    const f0 = autocorrelationPitch(frame, effectiveRate);
    if (f0 && f0 >= 70 && f0 <= 500) pitches.push(f0);
  }
  let pitchRangeHz: [number, number] | null = null;
  let pitchVariationPct = 0;
  if (pitches.length > 5) {
    const sorted = [...pitches].sort((a, b) => a - b);
    const p10 = sorted[Math.floor(sorted.length * 0.1)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    pitchRangeHz = [Math.round(p10), Math.round(p90)];
    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((a, b) => a + (b - mean) ** 2, 0) / pitches.length;
    pitchVariationPct = Math.round(((Math.sqrt(variance) / mean) * 100) * 10) / 10;
  }

  // --- Pace consistency: variance of local words-per-minute across segments ---
  let paceConsistencyPct = 100;
  if (wordTimings.length > 1) {
    const rates = wordTimings
      .filter((w) => w.endSec > w.startSec)
      .map((w) => w.wordCount / ((w.endSec - w.startSec) / 60));
    if (rates.length > 1) {
      const meanRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      const varRate = rates.reduce((a, b) => a + (b - meanRate) ** 2, 0) / rates.length;
      const cv = meanRate > 0 ? Math.sqrt(varRate) / meanRate : 0;
      paceConsistencyPct = Math.round(Math.max(0, Math.min(100, 100 - cv * 80)));
    }
  }

  return {
    pauses: { count: pauseCount, avgSec, longestSec },
    volumeConsistencyPct,
    paceConsistencyPct,
    pitchRangeHz,
    pitchVariationPct,
    durationSec,
  };
}
