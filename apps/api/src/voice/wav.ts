/**
 * Length of a RIFF/WAVE recording in seconds, from its `fmt ` byte rate and `data` size, or null
 * when the buffer is not a WAV file.
 */
export function wavSeconds(wav: Buffer): number | null {
  if (wav.length < 12) return null;
  if (wav.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (wav.toString('ascii', 8, 12) !== 'WAVE') return null;
  let byteRate = 0;
  for (let offset = 12; offset + 8 <= wav.length;) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ' && body + 12 <= wav.length) {
      byteRate = wav.readUInt32LE(body + 8);
    } else if (id === 'data') {
      if (!byteRate) return null;
      // A recorder that streamed the file may leave the size unset; the bytes left are the data.
      return Math.min(size, wav.length - body) / byteRate;
    }
    // Chunks are padded to an even length.
    offset = body + size + (size % 2);
  }
  return null;
}
