import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { imageSize } from '../../lib/media/probe.js';

const pub = (p) => fs.readFileSync(path.join(process.cwd(), 'public', p));

describe('imageSize', () => {
  it('reads a lossy VP8 webp', () => {
    expect(imageSize(pub('bg-hero.webp'))).toEqual({ width: 686, height: 386, mime: 'image/webp' });
  });

  it('reads the large map webp', () => {
    const r = imageSize(pub('map.webp'));
    expect(r.width).toBe(1449);
    expect(r.height).toBe(1153);
  });

  it('reads a gallery photo', () => {
    const r = imageSize(pub('photo/36.webp'));
    expect(r).toEqual({ width: 1024, height: 768, mime: 'image/webp' });
  });

  it('returns null for a non-image buffer', () => {
    expect(imageSize(Buffer.from('not an image at all'))).toBeNull();
  });

  it('returns null for a truncated header', () => {
    expect(imageSize(pub('bg-hero.webp').subarray(0, 8))).toBeNull();
  });
});
