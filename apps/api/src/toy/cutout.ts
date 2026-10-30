import jpeg from 'jpeg-js';

/** Where SAM found the object: its box in photo pixels and a 0/1 mask raster over that box. */
export interface Segment {
  box: { left: number; top: number; right: number; bottom: number };
  /** Row-major, 0 or 1; covers the box, usually scaled down. */
  mask: Uint8Array;
  maskWidth: number;
  maskHeight: number;
}

const WHITE = 255;

/**
 * Cuts the object out of a JPEG photo: crops to its box with a small margin, paints everything
 * outside the mask white and scales the result to fit `maxSide`. The white background matches
 * the character sheets Muse Image is asked to draw.
 */
export function cutout(photo: Buffer, segment: Segment, maxSide = 768): Buffer {
  const image = jpeg.decode(photo, { useTArray: true, formatAsRGBA: true });
  const { box } = segment;
  const boxWidth = box.right - box.left;
  const boxHeight = box.bottom - box.top;
  const margin = Math.round(Math.max(boxWidth, boxHeight) * 0.06);
  const left = Math.max(0, box.left - margin);
  const top = Math.max(0, box.top - margin);
  const right = Math.min(image.width, box.right + margin);
  const bottom = Math.min(image.height, box.bottom + margin);
  const scale = Math.min(1, maxSide / Math.max(right - left, bottom - top));
  const width = Math.max(1, Math.round((right - left) * scale));
  const height = Math.max(1, Math.round((bottom - top) * scale));

  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(image.height - 1, Math.floor(top + y / scale));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(image.width - 1, Math.floor(left + x / scale));
      const target = (y * width + x) * 4;
      const inside = insideMask(segment, sx, sy, boxWidth, boxHeight);
      const source = (sy * image.width + sx) * 4;
      out[target] = inside ? image.data[source] : WHITE;
      out[target + 1] = inside ? image.data[source + 1] : WHITE;
      out[target + 2] = inside ? image.data[source + 2] : WHITE;
      out[target + 3] = 255;
    }
  }
  return Buffer.from(jpeg.encode({ data: out, width, height }, 90).data);
}

function insideMask(
  segment: Segment,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number,
): boolean {
  const { box, mask, maskWidth, maskHeight } = segment;
  if (x < box.left || x >= box.right || y < box.top || y >= box.bottom)
    return false;
  const mx = Math.min(
    maskWidth - 1,
    Math.floor(((x - box.left) * maskWidth) / boxWidth),
  );
  const my = Math.min(
    maskHeight - 1,
    Math.floor(((y - box.top) * maskHeight) / boxHeight),
  );
  return mask[my * maskWidth + mx] === 1;
}
