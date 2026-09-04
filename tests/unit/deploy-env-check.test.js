/**
 * The production environment check.
 *
 * Every case here corresponds to a way the deployment can be silently wrong;
 * the readiness review (docs/deployment/2026-09-04-readiness-review.md) is the
 * source list. The point of the module is that these never reach production
 * unnoticed, so the point of this file is that the module keeps noticing.
 *
 * Imports need ../../ from tests/unit — a wrong relative path makes vitest
 * report the whole file as SKIPPED rather than failed, which has bitten this
 * project twice.
 */
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  checkEnvironment,
  checkMediaRootWritable,
  formatReport,
  isInside,
  isProductionServer,
  normalizeOrigin,
} from '../../lib/deploy/env-check.js';
import { siteOrigin } from '../../lib/seo/site.js';

/** A complete, correct production environment — the baseline each case breaks. */
const GOOD = {
  NODE_ENV: 'production',
  SITE_URL: 'https://staging.dhakabypass.com',
  MEDIA_ROOT: '/home/aeos365/media/dhakabypass',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_NAME: 'aeos365_dhakabypass',
  DB_USER: 'aeos365_dbedc',
  DB_PASSWORD: 'x',
  AUTH_SECRET: 'y',
  ADMIN_EMAILS: 'someone@example.com',
};
const RELEASE = '/home/aeos365/releases/dhakabypass-20260904';

const run = (over = {}, cwd = RELEASE, buildInfo = null) =>
  checkEnvironment({ env: { ...GOOD, ...over }, cwd, buildInfo });

const keys = (list) => list.map((e) => e.key);

describe('a correct environment', () => {
  it('reports nothing at all', () => {
    const { problems, warnings } = run();
    expect(problems).toEqual([]);
    expect(warnings).toEqual([]);
  });
});

describe('MEDIA_ROOT under a replace-style deploy', () => {
  // The release directory is swapped wholesale, so anything written inside it
  // is deleted by the next deploy. This is the assumption when build-info.json
  // records no deploy model, because its failure mode is a warning rather than
  // lost data.
  it('refuses an unset value', () => {
    expect(keys(run({ MEDIA_ROOT: undefined }).problems)).toContain('MEDIA_ROOT');
  });

  it('refuses an empty or whitespace value', () => {
    expect(keys(run({ MEDIA_ROOT: '' }).problems)).toContain('MEDIA_ROOT');
    expect(keys(run({ MEDIA_ROOT: '   ' }).problems)).toContain('MEDIA_ROOT');
  });

  it('refuses a relative path, which resolves against the release directory', () => {
    expect(keys(run({ MEDIA_ROOT: 'var/uploads' }).problems)).toContain('MEDIA_ROOT');
  });

  it('refuses a path inside the release directory', () => {
    expect(keys(run({ MEDIA_ROOT: `${RELEASE}/var/uploads` }).problems)).toContain('MEDIA_ROOT');
  });

  it('refuses the release directory itself', () => {
    expect(keys(run({ MEDIA_ROOT: RELEASE }).problems)).toContain('MEDIA_ROOT');
  });

  it('accepts a sibling directory that merely shares a prefix', () => {
    // /home/aeos365/releases/dhakabypass-20260904-media is NOT inside the
    // release directory, and a naive startsWith() would say it was.
    expect(keys(run({ MEDIA_ROOT: `${RELEASE}-media` }).problems)).not.toContain('MEDIA_ROOT');
  });

  it('explains the consequence, not just the rule', () => {
    const [p] = run({ MEDIA_ROOT: undefined }).problems.filter((e) => e.key === 'MEDIA_ROOT');
    expect(p.why).toMatch(/deploy/i);
    expect(p.fix).toMatch(/absolute/i);
  });
});

describe('MEDIA_ROOT under a git-pull deploy', () => {
  // The release directory is a checkout updated in place. `git pull` and
  // `git reset --hard` both leave untracked files alone, so an ignored
  // var/uploads survives every deploy and the default is acceptable —
  // demanding a hand-created directory would be friction with nothing behind it.
  const pull = { deployModel: 'git-pull', siteUrl: 'https://staging.dhakabypass.com' };
  const runPull = (over = {}) => run(over, RELEASE, pull);

  it('accepts an unset value, with a warning about a fresh clone', () => {
    const r = runPull({ MEDIA_ROOT: undefined });
    expect(keys(r.problems)).not.toContain('MEDIA_ROOT');
    const w = r.warnings.find((e) => e.key === 'MEDIA_ROOT');
    expect(w.why).toMatch(/fresh clone/i);
  });

  it('accepts a path inside the release directory, with a warning', () => {
    const r = runPull({ MEDIA_ROOT: `${RELEASE}/var/uploads` });
    expect(keys(r.problems)).not.toContain('MEDIA_ROOT');
    expect(keys(r.warnings)).toContain('MEDIA_ROOT');
  });

  it('still refuses a relative path, which is a mistake under any model', () => {
    expect(keys(runPull({ MEDIA_ROOT: 'var/uploads' }).problems)).toContain('MEDIA_ROOT');
  });

  it('says nothing at all about a proper external path', () => {
    const r = runPull();
    expect(r.problems).toEqual([]);
    expect(r.warnings).toEqual([]);
  });
});

describe('SITE_URL — the site quietly deindexing itself', () => {
  it('refuses an unset value', () => {
    expect(keys(run({ SITE_URL: undefined }).problems)).toContain('SITE_URL');
  });

  it('refuses a value that cannot be parsed', () => {
    expect(keys(run({ SITE_URL: 'http://' }).problems)).toContain('SITE_URL');
  });

  it.each(['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost'])(
    'refuses the local address %s',
    (url) => {
      expect(keys(run({ SITE_URL: url }).problems)).toContain('SITE_URL');
    },
  );

  it('warns, but does not refuse, on http', () => {
    const r = run({ SITE_URL: 'http://dhakabypass.com' });
    expect(keys(r.problems)).not.toContain('SITE_URL');
    expect(keys(r.warnings)).toContain('SITE_URL');
  });

  it('warns on a bare hostname, since lib/seo/site.js silently assumes https', () => {
    const r = run({ SITE_URL: 'dhakabypass.com' });
    expect(keys(r.problems)).not.toContain('SITE_URL');
    expect(r.warnings.some((w) => /no scheme/i.test(w.message))).toBe(true);
  });
});

describe('the origin baked into the artifact', () => {
  // next build prerenders /[locale] and the sitemap, so the origin is written
  // into 74 files on the build machine. An artifact belongs to one origin.
  it('refuses to serve a staging artifact from production', () => {
    const r = run(
      { SITE_URL: 'https://dhakabypass.com' },
      RELEASE,
      { siteUrl: 'https://staging.dhakabypass.com' },
    );
    const p = r.problems.find((e) => e.key === 'SITE_URL');
    expect(p).toBeTruthy();
    expect(p.message).toMatch(/built with/i);
  });

  it('accepts a matching origin', () => {
    const r = run({}, RELEASE, { siteUrl: 'https://staging.dhakabypass.com' });
    expect(keys(r.problems)).not.toContain('SITE_URL');
  });

  it('treats a trailing slash and a bare host as the same origin', () => {
    const r = run(
      { SITE_URL: 'https://staging.dhakabypass.com/' },
      RELEASE,
      { siteUrl: 'staging.dhakabypass.com' },
    );
    expect(keys(r.problems)).not.toContain('SITE_URL');
  });

  it('says nothing when the artifact records no origin', () => {
    // A plain `next build` with no packaging step. Absence is not a mismatch.
    const r = run({}, RELEASE, { siteUrl: '' });
    expect(keys(r.problems)).not.toContain('SITE_URL');
  });
});

describe('database configuration', () => {
  it.each(['DB_HOST', 'DB_NAME', 'DB_USER'])('refuses to boot without %s', (k) => {
    expect(keys(run({ [k]: '' }).problems)).toContain('DB');
  });

  it('names every missing variable in one problem, not one problem each', () => {
    const r = run({ DB_HOST: '', DB_NAME: '', DB_USER: '' });
    const dbProblems = r.problems.filter((p) => p.key === 'DB');
    expect(dbProblems).toHaveLength(1);
    expect(dbProblems[0].message).toMatch(/DB_HOST.*DB_NAME.*DB_USER/);
  });

  it('warns on an empty password rather than refusing', () => {
    const r = run({ DB_PASSWORD: '' });
    expect(keys(r.problems)).not.toContain('DB');
    expect(keys(r.warnings)).toContain('DB_PASSWORD');
  });
});

describe('admin configuration — warnings, deliberately', () => {
  // These break the admin, not the public site. Refusing to serve the public
  // site because nobody can log in would be the worse trade.
  it('warns without AUTH_SECRET', () => {
    const r = run({ AUTH_SECRET: '' });
    expect(r.problems).toEqual([]);
    expect(keys(r.warnings)).toContain('AUTH_SECRET');
  });

  it('warns on an empty ADMIN_EMAILS', () => {
    const r = run({ ADMIN_EMAILS: '' });
    expect(r.problems).toEqual([]);
    expect(keys(r.warnings)).toContain('ADMIN_EMAILS');
  });
});

describe('isProductionServer', () => {
  it('is false in development', () => {
    expect(isProductionServer({ NODE_ENV: 'development' })).toBe(false);
  });

  it('is false during next build, which also runs as production', () => {
    // Without this the check would fail every build on a machine that has no
    // production credentials — and would promptly be deleted by whoever hit it.
    expect(
      isProductionServer({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' }),
    ).toBe(false);
  });

  it('is true when serving, including when NEXT_PHASE is absent', () => {
    // The generated standalone server sets NODE_ENV and nothing else.
    expect(isProductionServer({ NODE_ENV: 'production' })).toBe(true);
    expect(
      isProductionServer({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-server' }),
    ).toBe(true);
  });
});

describe('normalizeOrigin agrees with lib/seo/site.js', () => {
  // env-check.js may not import from lib/, because it is copied verbatim into
  // the deployed artifact where lib/ does not exist. That duplication is only
  // safe while the two implementations agree, so this pins them together: a
  // change to one that is not mirrored in the other fails here.
  it.each([
    'https://dhakabypass.com',
    'https://dhakabypass.com/',
    'http://dhakabypass.com',
    'dhakabypass.com',
    'https://staging.dhakabypass.com',
    'https://dhakabypass.com:8443',
    '  https://dhakabypass.com  ',
  ])('%s', (input) => {
    const before = process.env.SITE_URL;
    try {
      process.env.SITE_URL = input;
      expect(normalizeOrigin(input)).toBe(siteOrigin());
    } finally {
      if (before === undefined) delete process.env.SITE_URL;
      else process.env.SITE_URL = before;
    }
  });

  it('returns null where siteOrigin falls back, so the caller can notice', () => {
    // siteOrigin() must always yield something — it runs inside robots.txt and
    // sitemap.xml, where throwing is a 500. This module's job is the opposite.
    expect(normalizeOrigin('')).toBeNull();
    expect(normalizeOrigin('http://')).toBeNull();
  });
});

describe('isInside', () => {
  it('treats a directory as inside itself', () => {
    expect(isInside('/a/b', '/a/b')).toBe(true);
  });

  it('recognises a descendant', () => {
    expect(isInside('/a/b', '/a/b/c/d')).toBe(true);
  });

  it('does not treat a shared prefix as containment', () => {
    expect(isInside('/a/b', '/a/bc')).toBe(false);
  });

  it('normalises traversal', () => {
    expect(isInside('/a/b', '/a/b/../c')).toBe(false);
  });
});

describe('checkMediaRootWritable', () => {
  const fakeFs = (impl) => ({
    stat: impl.stat || (async () => ({ isDirectory: () => true })),
    access: impl.access || (async () => {}),
  });

  it('passes for a writable directory', async () => {
    expect(await checkMediaRootWritable('/media', fakeFs({}))).toEqual([]);
  });

  it('reports a directory that does not exist', async () => {
    // saveUpload does mkdir({recursive:true}), so a typo becomes a real
    // directory in the wrong place and nothing ever reports it.
    const out = await checkMediaRootWritable(
      '/nope',
      fakeFs({ stat: async () => { throw new Error('ENOENT'); } }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].message).toMatch(/does not exist/);
    expect(out[0].fix).toMatch(/mkdir -p/);
  });

  it('reports a path that is a file', async () => {
    const out = await checkMediaRootWritable(
      '/afile',
      fakeFs({ stat: async () => ({ isDirectory: () => false }) }),
    );
    expect(out[0].message).toMatch(/not a directory/);
  });

  it('reports a directory it cannot write to', async () => {
    const out = await checkMediaRootWritable(
      '/ro',
      fakeFs({ access: async () => { throw new Error('EACCES'); } }),
    );
    expect(out[0].message).toMatch(/not writable/);
  });

  it('checks for write permission specifically, not merely existence', async () => {
    let mode = null;
    await checkMediaRootWritable('/media', fakeFs({ access: async (_d, m) => { mode = m; } }));
    expect(mode).toBe(2); // fs.constants.W_OK
  });
});

describe('formatReport', () => {
  it('states the fix inline, so a log is enough to act on', () => {
    const out = formatReport(run({ MEDIA_ROOT: undefined }), { heading: 'H', cwd: RELEASE });
    expect(out).toContain('H');
    expect(out).toContain(RELEASE);
    expect(out).toMatch(/why:/);
    expect(out).toMatch(/fix:/);
  });

  it('reports a clean environment as clean', () => {
    expect(formatReport({ problems: [], warnings: [] })).toMatch(/All checks passed/);
  });

  it('wraps long text rather than emitting one unreadable line', () => {
    const out = formatReport(run({ MEDIA_ROOT: undefined }));
    for (const line of out.split('\n')) expect(line.length).toBeLessThanOrEqual(90);
  });

  it('counts problems and warnings separately', () => {
    const out = formatReport({
      problems: [{ key: 'A', message: 'a' }],
      warnings: [{ key: 'B', message: 'b' }, { key: 'C', message: 'c' }],
    });
    expect(out).toMatch(/1 problem —/);
    expect(out).toMatch(/2 warnings —/);
  });
});

describe('the release directory is what MEDIA_ROOT is measured against', () => {
  it('uses the cwd it is given, not the test runner\'s', () => {
    const other = '/srv/app';
    expect(keys(checkEnvironment({
      env: { ...GOOD, MEDIA_ROOT: path.join(other, 'uploads') },
      cwd: other,
    }).problems)).toContain('MEDIA_ROOT');
  });
});
