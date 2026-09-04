/**
 * The boot gate itself — that a bad production environment stops the server
 * rather than being logged and ignored.
 *
 * The check module is tested exhaustively in deploy-env-check.test.js; what is
 * tested here is the wiring, because every one of these is a way the gate could
 * silently stop gating: firing during a build and getting deleted by whoever
 * hits it, refusing to start in development, or printing a report and carrying
 * on anyway.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertBootEnvironment } from '../../lib/deploy/boot-check.js';

/**
 * A real, writable directory. The boot check stats MEDIA_ROOT — a path that
 * merely looks right but does not exist is a problem, correctly, so a "good"
 * environment in these tests needs one that genuinely exists.
 */
let MEDIA;
beforeAll(() => {
  MEDIA = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-media-'));
});
afterAll(() => {
  fs.rmSync(MEDIA, { recursive: true, force: true });
});

/** Collects what would have gone to the log, and whether the process would die. */
function harness(env, cwd = '/home/aeos365/apps/dhakabypass') {
  const out = [];
  let exited = null;
  return {
    out,
    get log() { return out.join(''); },
    get exited() { return exited; },
    run: () =>
      assertBootEnvironment({
        env,
        cwd,
        stderr: { write: (s) => out.push(s) },
        exit: (code) => { exited = code; },
      }),
  };
}

const good = () => ({
  NODE_ENV: 'production',
  SITE_URL: 'https://staging.dhakabypass.com',
  MEDIA_ROOT: MEDIA,
  DB_HOST: '127.0.0.1',
  DB_NAME: 'aeos365_dhakabypass',
  DB_USER: 'aeos365_dbedc',
  DB_PASSWORD: 'x',
  AUTH_SECRET: 'y',
  ADMIN_EMAILS: 'a@example.com',
});

describe('when the check does not apply', () => {
  it('does nothing in development', async () => {
    const h = harness({ NODE_ENV: 'development' });
    expect((await h.run()).checked).toBe(false);
    expect(h.exited).toBeNull();
    expect(h.log).toBe('');
  });

  it('does nothing during next build', async () => {
    // A build runs with NODE_ENV=production and bootstraps this hook in its
    // static-generation workers. Firing there would fail every build on a
    // machine without production credentials.
    const h = harness({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' });
    expect((await h.run()).checked).toBe(false);
    expect(h.exited).toBeNull();
  });
});

describe('when the environment is wrong', () => {
  it('exits non-zero rather than serving', async () => {
    const h = harness({ ...good(), SITE_URL: '' });
    await h.run();
    expect(h.exited).toBe(1);
  });

  it('says what is wrong, what it causes, and how to fix it', async () => {
    const h = harness({ ...good(), SITE_URL: '' });
    await h.run();
    expect(h.log).toMatch(/REFUSING TO START/);
    expect(h.log).toMatch(/SITE_URL is not set/);
    expect(h.log).toMatch(/why:/);
    expect(h.log).toMatch(/fix:/);
  });

  it('names the release directory, so it is obvious which app this is', async () => {
    const h = harness({ ...good(), DB_NAME: '' }, '/home/aeos365/apps/dhakabypass-staging');
    await h.run();
    expect(h.log).toContain('/home/aeos365/apps/dhakabypass-staging');
  });

  it('points at preflight and the runbook', async () => {
    const h = harness({ ...good(), DB_NAME: '' });
    await h.run();
    expect(h.log).toMatch(/preflight\.mjs/);
    expect(h.log).toMatch(/deploy-runbook/);
  });
});

describe('the override', () => {
  const bad = () => ({ ...good(), SITE_URL: '' });

  it('starts anyway when set to the exact phrase', async () => {
    const h = harness({ ...bad(), DHAKABYPASS_SKIP_ENV_CHECK: 'i-accept-the-risk' });
    const r = await h.run();
    expect(h.exited).toBeNull();
    expect(r.started).toBe(true);
    expect(r.overridden).toBe(true);
  });

  it('still prints every problem, so the override cannot hide them', async () => {
    const h = harness({ ...bad(), DHAKABYPASS_SKIP_ENV_CHECK: 'i-accept-the-risk' });
    await h.run();
    expect(h.log).toMatch(/SITE_URL is not set/);
    expect(h.log).toMatch(/are NOT fixed/);
  });

  it.each(['1', 'true', 'yes', 'i-accept-the-risks', ''])(
    'is not triggered by %o — it has to be typed deliberately',
    async (value) => {
      const h = harness({ ...bad(), DHAKABYPASS_SKIP_ENV_CHECK: value });
      await h.run();
      expect(h.exited).toBe(1);
    },
  );
});

describe('when the environment is right', () => {
  it('starts silently', async () => {
    const h = harness(good());
    const r = await h.run();
    expect(h.exited).toBeNull();
    expect(r.started).toBe(true);
    expect(h.log).toBe('');
  });

  it('starts but reports warnings', async () => {
    const h = harness({ ...good(), AUTH_SECRET: '' });
    const r = await h.run();
    expect(h.exited).toBeNull();
    expect(r.started).toBe(true);
    expect(h.log).toMatch(/with warnings/);
    expect(h.log).toMatch(/AUTH_SECRET/);
  });
});

describe('the media directory is checked on disk, not merely in the string', () => {
  // saveUpload does mkdir({recursive:true}), so a wrong-but-creatable path is
  // created silently and looks like it worked. Boot is the last moment this can
  // be caught before a content editor discovers it.
  it('refuses to start when MEDIA_ROOT does not exist', async () => {
    const h = harness({ ...good(), MEDIA_ROOT: '/definitely/not/a/real/path' });
    await h.run();
    expect(h.exited).toBe(1);
    expect(h.log).toMatch(/does not exist/);
  });
});
