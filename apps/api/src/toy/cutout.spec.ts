import jpeg from 'jpeg-js';
import { cutout } from './cutout';

/** A 100×100 red photo. */
function photo(): Buffer {
  const data = new Uint8Array(100 * 100 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([220, 30, 30, 255], i);
  return Buffer.from(jpeg.encode({ data, width: 100, height: 100 }, 95).data);
}

describe('cutout', () => {
  // Box 40..60, mask 2×2 at half resolution: only the top-left quarter is the object.
  const segment = {
    box: { left: 40, top: 40, right: 60, bottom: 60 },
    mask: Uint8Array.from([1, 0, 0, 0]),
    maskWidth: 2,
    maskHeight: 2,
  };

  it('crops to the box with a margin and keeps only the masked pixels', () => {
    const out = jpeg.decode(cutout(photo(), segment), { useTArray: true });
    expect(out.width).toBe(22);
    expect(out.height).toBe(22);
    const pixel = (x: number, y: number) =>
      Array.from(
        out.data.slice((y * out.width + x) * 4, (y * out.width + x) * 4 + 3),
      );
    const [r, g] = pixel(5, 5);
    expect(r).toBeGreaterThan(180);
    expect(g).toBeLessThan(80);
    expect(pixel(16, 16).every((c) => c > 240)).toBe(true);
    expect(pixel(0, 0).every((c) => c > 240)).toBe(true);
  });

  it('scales down to fit the longest side', () => {
    const out = jpeg.decode(cutout(photo(), segment, 11), { useTArray: true });
    expect(Math.max(out.width, out.height)).toBe(11);
  });
});
