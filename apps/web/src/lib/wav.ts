/** What the voice API wants: 16 kHz mono 16-bit PCM. */
export const VOICE_SAMPLE_RATE = 16_000;

/**
 * Resamples mono audio by linear interpolation; going down, each output sample first averages the
 * input samples it covers, so high frequencies fold in less.
 */
export function resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate || samples.length === 0) return samples.slice();
  const ratio = fromRate / toRate;
  const out = new Float32Array(Math.max(1, Math.floor(samples.length / ratio)));
  for (let i = 0; i < out.length; i++) {
    const at = i * ratio;
    if (ratio > 1) {
      const start = Math.floor(at);
      const end = Math.min(samples.length, Math.max(start + 1, Math.floor(at + ratio)));
      let sum = 0;
      for (let j = start; j < end; j++) sum += samples[j];
      out[i] = sum / (end - start);
    } else {
      const left = Math.floor(at);
      const right = Math.min(left + 1, samples.length - 1);
      out[i] = samples[left] + (samples[right] - samples[left]) * (at - left);
    }
  }
  return out;
}

/** A RIFF/WAVE file of mono 16-bit PCM; samples outside -1..1 are clipped. */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/** Recorded chunks as one WAV for the voice API: joined, resampled to 16 kHz, cut to `maxSeconds`. */
export function recordingToWav(chunks: Float32Array[], sampleRate: number, maxSeconds: number): ArrayBuffer {
  const joined = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  const samples = resample(joined, sampleRate, VOICE_SAMPLE_RATE);
  return encodeWav(samples.subarray(0, maxSeconds * VOICE_SAMPLE_RATE), VOICE_SAMPLE_RATE);
}
