/**
 * Minimal image header reader. We register 51 existing files and need their
 * real pixel dimensions so <img> can carry width/height and reserve layout
 * space. Pulling in a dependency for four header formats is not worth it on
 * a memory-limited shared host.
 *
 * Returns null rather than throwing for anything unrecognised: a bad file in
 * public/ must not abort the whole import run.
 */
function webp(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (kind === 'VP8X') {
    const w = buf[24] | (buf[25] << 8) | (buf[26] << 16);
    const h = buf[27] | (buf[28] << 8) | (buf[29] << 16);
    return { width: w + 1, height: h + 1 };
  }
  return null;
}

function png(buf) {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    // SOF0-SOF15, excluding the non-frame markers DHT (c4), JPGA (c8), DAC (cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

export function imageSize(buffer) {
  if (!buffer || buffer.length < 12) return null;
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const w = webp(buf);
  if (w && w.width > 0 && w.height > 0) return { ...w, mime: 'image/webp' };
  const p = png(buf);
  if (p && p.width > 0 && p.height > 0) return { ...p, mime: 'image/png' };
  const j = jpeg(buf);
  if (j && j.width > 0 && j.height > 0) return { ...j, mime: 'image/jpeg' };
  return null;
}
