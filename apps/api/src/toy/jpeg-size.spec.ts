import jpeg from 'jpeg-js';
import { jpegSize } from './jpeg-size';

describe('jpegSize', () => {
  it('reads the size of a real JPEG', () => {
    const data = new Uint8Array(30 * 20 * 4).fill(200);
    const file = Buffer.from(
      jpeg.encode({ data, width: 30, height: 20 }, 80).data,
    );
    expect(jpegSize(file)).toEqual({ width: 30, height: 20 });
  });

  it('refuses bytes that are not a JPEG', () => {
    expect(jpegSize(Buffer.from('<svg></svg>'))).toBeNull();
    expect(jpegSize(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
  });
});
