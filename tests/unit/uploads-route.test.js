import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

let tmpRoot;
let GET;

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dhakabypass-uploads-'));
  process.env.MEDIA_ROOT = tmpRoot;
  await fs.writeFile(path.join(tmpRoot, 'ok.png'), Buffer.from('fake png bytes'));
  await fs.writeFile(path.join(tmpRoot, 'ok.svg'), '<svg></svg>');
  await fs.writeFile(path.join(tmpRoot, 'secret.env'), 'DB_PASSWORD=x');
  ({ GET } = await import('../../app/uploads/[...path]/route.js'));
});

afterAll(async () => {
  delete process.env.MEDIA_ROOT;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

function paramsFor(...segments) {
  return { params: Promise.resolve({ path: segments }) };
}

describe('GET /uploads/[...path]', () => {
  it('serves an allowed file with the correct content type and hardening headers', async () => {
    const res = await GET(new Request('http://x/uploads/ok.png'), paramsFor('ok.png'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
  });

  it('sets Content-Disposition: attachment for svg so it cannot execute inline if opened directly', async () => {
    const res = await GET(new Request('http://x/uploads/ok.svg'), paramsFor('ok.svg'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml');
    expect(res.headers.get('content-disposition')).toBe('attachment');
  });

  it('returns 404 for a disallowed extension, even for a real file on disk', async () => {
    const res = await GET(new Request('http://x/uploads/secret.env'), paramsFor('secret.env'));
    expect(res.status).toBe(404);
  });

  it('returns 404 for a missing file', async () => {
    const res = await GET(new Request('http://x/uploads/nope.png'), paramsFor('nope.png'));
    expect(res.status).toBe(404);
  });

  it('returns 404 for a path-traversal attempt instead of reading outside uploadRoot', async () => {
    const res = await GET(
      new Request('http://x/uploads/../../etc/passwd'),
      paramsFor('..', '..', 'etc', 'passwd')
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 for a traversal attempt reaching for a real file outside the root', async () => {
    // A file that genuinely exists one level above tmpRoot — proves the
    // guard isn't just "the target happens not to exist".
    const outside = path.join(tmpRoot, '..', 'sibling.png');
    await fs.writeFile(outside, 'outside bytes');
    try {
      const res = await GET(
        new Request('http://x/uploads/../sibling.png'),
        paramsFor('..', 'sibling.png')
      );
      expect(res.status).toBe(404);
    } finally {
      await fs.rm(outside, { force: true });
    }
  });

  it('returns 404 when params.path is empty', async () => {
    const res = await GET(new Request('http://x/uploads/'), paramsFor());
    expect(res.status).toBe(404);
  });
});
