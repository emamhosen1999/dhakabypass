/**
 * `saveUpload` must record the picture's real pixel dimensions.
 *
 * Before this, the INSERT named only (path, bytes, mime, alt) and every
 * uploaded image landed with width = 0, height = 0. Two things break on that:
 * the Media screen reports "Size unknown" for everything an operator ever
 * uploads, and `components/SiteImage.jsx` drops the `width`/`height`
 * attributes — so the browser reserves no box and the page jumps under the
 * reader while the bytes arrive.
 *
 * `lib/media/probe.js` already reads WebP, PNG and JPEG headers; this is about
 * calling it on the upload path, not about adding a dependency.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

vi.mock('../../lib/db.js', () => ({
  query: vi.fn(),
  dbEnabled: vi.fn(() => true),
}));

import { query, dbEnabled } from '../../lib/db.js';
import { saveUpload } from '../../lib/media.js';

/** A 24-byte PNG: the 8-byte signature plus the IHDR length, tag and size. */
function pngBytes(width, height) {
  const buf = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

let root;
let previousRoot;

beforeEach(async () => {
  vi.clearAllMocks();
  dbEnabled.mockReturnValue(true);
  query.mockResolvedValue({ insertId: 7 });
  previousRoot = process.env.MEDIA_ROOT;
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'dbx-upload-'));
  process.env.MEDIA_ROOT = root;
});

afterEach(async () => {
  if (previousRoot === undefined) delete process.env.MEDIA_ROOT;
  else process.env.MEDIA_ROOT = previousRoot;
  await fs.rm(root, { recursive: true, force: true });
});

/** The INSERT's parameters, keyed by the column list it names. */
function insertedColumns() {
  const [sql, params] = query.mock.calls[0];
  const names = sql.slice(sql.indexOf('(') + 1, sql.indexOf(')')).split(',').map((s) => s.trim());
  return Object.fromEntries(names.map((name, i) => [name, params[i]]));
}

describe('saveUpload — dimensions', () => {
  it('records the width and height read out of the file', async () => {
    await saveUpload({ buffer: pngBytes(2400, 1350), filename: 'aerial.png', mime: 'image/png' });

    const row = insertedColumns();
    expect(row.width).toBe(2400);
    expect(row.height).toBe(1350);
  });

  it('still records the path, byte count and mime type', async () => {
    const buffer = pngBytes(800, 600);
    const saved = await saveUpload({ buffer, filename: 'Aerial View.png', mime: 'image/png' });

    const row = insertedColumns();
    expect(row.path).toBe('/uploads/aerial-view.png');
    expect(row.bytes).toBe(buffer.length);
    expect(row.mime).toBe('image/png');
    expect(saved.path).toBe('/uploads/aerial-view.png');
  });

  it('inserts an empty alt object — nobody has described the picture yet', async () => {
    await saveUpload({ buffer: pngBytes(800, 600), filename: 'a.png', mime: 'image/png' });
    expect(JSON.parse(insertedColumns().alt)).toEqual({});
  });

  it('falls back to zero when the header cannot be read, and still stores the file', async () => {
    // An SVG has no pixel header. Zero is what `SiteImage` and the Media screen
    // already treat as "unknown"; refusing the upload here would be a new
    // failure mode on a file type lib/media.js deliberately admits.
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');
    await saveUpload({ buffer: svg, filename: 'mark.svg', mime: 'image/svg+xml' });

    const row = insertedColumns();
    expect(row.width).toBe(0);
    expect(row.height).toBe(0);
    expect(row.path).toBe('/uploads/mark.svg');
    await expect(fs.readFile(path.join(root, 'mark.svg'))).resolves.toBeTruthy();
  });

  it('falls back to zero for a truncated image rather than throwing', async () => {
    await saveUpload({ buffer: Buffer.alloc(40), filename: 'broken.png', mime: 'image/png' });
    const row = insertedColumns();
    expect(row.width).toBe(0);
    expect(row.height).toBe(0);
  });
});
