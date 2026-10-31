import { describe, expect, it } from "vitest";
import { encodeWav, recordingToWav, resample, VOICE_SAMPLE_RATE } from "./wav";

const ascii = (view: DataView, offset: number, length: number) =>
  String.fromCharCode(...Array.from({ length }, (_, i) => view.getUint8(offset + i)));

describe("encodeWav", () => {
  it("writes a 16-bit mono PCM header and samples", () => {
    const view = new DataView(encodeWav(new Float32Array([0, 1, -1, 0.5]), 16_000));
    expect(view.byteLength).toBe(44 + 8);
    expect(ascii(view, 0, 4)).toBe("RIFF");
    expect(view.getUint32(4, true)).toBe(36 + 8);
    expect(ascii(view, 8, 8)).toBe("WAVEfmt ");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint32(28, true)).toBe(32_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(view, 36, 4)).toBe("data");
    expect(view.getUint32(40, true)).toBe(8);
    expect([0, 1, 2, 3].map((i) => view.getInt16(44 + i * 2, true))).toEqual([0, 32767, -32768, 16383]);
  });

  it("clips samples outside -1..1", () => {
    const view = new DataView(encodeWav(new Float32Array([2, -3]), 16_000));
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
  });
});

describe("resample", () => {
  it("keeps the duration when going from 48 kHz to 16 kHz", () => {
    expect(resample(new Float32Array(48_000), 48_000, 16_000)).toHaveLength(16_000);
  });

  it("averages the samples it drops", () => {
    expect(Array.from(resample(new Float32Array([0, 0.3, 0.6, 1, 1, 1]), 48_000, 16_000))).toEqual([
      expect.closeTo(0.3),
      expect.closeTo(1),
    ]);
  });

  it("interpolates when going up", () => {
    expect(Array.from(resample(new Float32Array([0, 1]), 8_000, 16_000))).toEqual([0, 0.5, 1, 1]);
  });

  it("copies when the rate is already right", () => {
    const samples = new Float32Array([0.1, 0.2]);
    const out = resample(samples, 16_000, 16_000);
    expect(out).toEqual(samples);
    expect(out).not.toBe(samples);
  });
});

describe("recordingToWav", () => {
  it("joins chunks, resamples to 16 kHz and cuts to the limit", () => {
    const second = new Float32Array(44_100).fill(0.25);
    const view = new DataView(recordingToWav([second, second, second], 44_100, 2));
    expect(view.getUint32(24, true)).toBe(VOICE_SAMPLE_RATE);
    expect(view.getUint32(40, true)).toBe(2 * VOICE_SAMPLE_RATE * 2);
    expect(view.getInt16(44, true)).toBe(Math.trunc(0.25 * 0x7fff));
  });
});
