/**
 * Turns `next build`'s output into something that can actually boot on the
 * server, and then into a release tarball.
 *
 * WHY THIS FILE EXISTS. `output: 'standalone'` does not produce a
 * self-contained directory, despite the name. `next build` leaves:
 *
 *   .next/standalone/          server.js + the traced node_modules   (~56 MB)
 *   .next/static/              every client JS chunk and stylesheet  (~1.4 MB)
 *   public/                    fonts, images, icons                  (~9.5 MB)
 *   .next/cache/               the build machine's ISR + fetch cache (~141 MB)
 *
 * The first three are all required at runtime and only the first is inside
 * `standalone`. Next's documentation says to copy the other two in by hand.
 * Nothing in this project did, which is blocker B2 in the readiness review: the
 * deployed site would serve HTML with every stylesheet, script and font 404ing.
 * Running this as a `postbuild` step means the copy cannot be forgotten,
 * because it is no longer a step anyone has to remember.
 *
 * The fourth must NOT be shipped. `.next/cache` holds `unstable_cache` entries
 * — the build machine's own database reads. The header of lib/corridor/cache.js
 * records that shipping them has already happened once, and that a stale entry
 * baked in from a developer's database would otherwise persist in production
 * forever. It is excluded here, deliberately and permanently.
 *
 * WHAT ELSE GOES IN. Two things the artifact needs that Next knows nothing about:
 *
 *   build-info.json  — what this artifact is: commit, build time, and above all
 *                      the origin it was PRERENDERED FOR. See below.
 *   preflight.mjs    — the environment check, runnable on the server before the
 *                      app is started, so a misconfiguration is found by an
 *                      operator on purpose rather than by a visitor by accident.
 *
 * THE BAKED ORIGIN, which is the subtle one. lib/seo/site.js documents SITE_URL
 * as a request-time variable, so that the operator can change the domain in the
 * cPanel environment editor and restart. That is true of robots.txt, which is
 * force-dynamic. It is NOT true of the localised pages or the sitemap: they are
 * prerendered by `next build`, `generateMetadata` runs on the build machine,
 * and the origin is written into the HTML. A build with SITE_URL set to a probe
 * value puts that value into 74 files and 90 sitemap URLs — measured, not
 * assumed.
 *
 * So an artifact belongs to exactly one origin. Recording it here is what lets
 * the app refuse to start when it is served from a different one, which is the
 * only thing standing between a staging tarball and a production site
 * advertising staging canonicals to Google.
 *
 * USAGE
 *   node scripts/package-standalone.mjs            assemble in place (postbuild)
 *   node scripts/package-standalone.mjs --tar      assemble, then write a tarball
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { loadEnv } from './load-env.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const NEXT_DIR = path.join(ROOT, '.next');
const STANDALONE = path.join(NEXT_DIR, 'standalone');
const DIST = path.join(ROOT, 'var', 'dist');

const args = process.argv.slice(2);
const wantTar = args.includes('--tar');

/**
 * How this release reaches the server, recorded in the artifact because the
 * runtime checks depend on it.
 *
 *   'git-pull'  the release directory is a git checkout updated in place
 *               (scripts/release-to-branch.mjs). Untracked files survive a
 *               deploy, so uploads under var/uploads are safe where they are.
 *   'replace'   the release directory is swapped wholesale — a tarball, an
 *               rsync, a new timestamped directory. Anything inside it is
 *               deleted by the next deploy.
 *
 * Defaults to git-pull because that is the model this project deploys with.
 * `--tar` produces an artifact for the other kind, so it flips the default.
 */
const deployModel =
  (args.find((a) => a.startsWith('--deploy-model=')) || '').split('=')[1] ||
  (wantTar ? 'replace' : 'git-pull');

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
function step(s) { console.log(`\n${bold('==>')} ${s}`); }
function ok(s) { console.log(`    ${s}`); }
function die(message, fix) {
  console.error(`\n\x1b[31m    FAILED: ${message}\x1b[0m`);
  if (fix) console.error(`    ${fix}\n`);
  process.exit(1);
}

/** Bytes, formatted the way a human reads a deploy log. */
function human(bytes) {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i += 1; }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${u[i]}`;
}

async function dirSize(dir) {
  let total = 0;
  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) total += await dirSize(p);
    else if (e.isFile()) total += (await fsp.stat(p)).size;
  }
  return total;
}

async function countFiles(dir) {
  let n = 0;
  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    if (e.isDirectory()) n += await countFiles(path.join(dir, e.name));
    else n += 1;
  }
  return n;
}

/**
 * Replace a directory wholesale rather than merging into it.
 *
 * A merge would leave a chunk from a previous build sitting in
 * `.next/standalone/.next/static` forever — harmless until the day a stale
 * file shadows a new one and the page renders with a stylesheet from two
 * releases ago. Deleting first makes each package deterministic.
 */
async function replaceDir(src, dest) {
  await fsp.rm(dest, { recursive: true, force: true });
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.cp(src, dest, { recursive: true, dereference: true });
}

function git(...a) {
  try {
    return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

async function main() {
  // Same precedence Next itself uses, so the origin recorded here is the origin
  // the build actually rendered with — including when it came from .env.local
  // rather than the shell, which is the normal case on a developer machine.
  loadEnv();

  step('Checking the build output');
  if (!fs.existsSync(STANDALONE)) {
    die(
      '.next/standalone does not exist.',
      'Run `npm run build` first. If it ran and this is still missing, check that ' +
        "next.config.mjs still sets output: 'standalone'.",
    );
  }
  if (!fs.existsSync(path.join(STANDALONE, 'server.js'))) {
    die(
      '.next/standalone/server.js is missing — there is no entry point to start.',
      'The build did not complete. Re-run `npm run build` and read its output.',
    );
  }
  if (!fs.existsSync(path.join(NEXT_DIR, 'static'))) {
    die('.next/static is missing.', 'The build did not complete. Re-run `npm run build`.');
  }
  ok('server.js, .next/static and public/ are present');

  step('Copying the pieces standalone leaves behind');
  await replaceDir(path.join(NEXT_DIR, 'static'), path.join(STANDALONE, '.next', 'static'));
  ok(`.next/static      -> standalone/.next/static   ${dim(human(await dirSize(path.join(STANDALONE, '.next', 'static'))))}`);
  await replaceDir(path.join(ROOT, 'public'), path.join(STANDALONE, 'public'));
  ok(`public/           -> standalone/public         ${dim(human(await dirSize(path.join(STANDALONE, 'public'))))}`);

  step('Adding the deployment tooling');
  // Copied, not imported: the artifact contains compiled output, not lib/
  // source, so preflight cannot reach the real module at runtime. env-check.js
  // is written with no project imports precisely so this copy is a copy and
  // never a fork — see the constraints documented at the top of that file.
  await fsp.mkdir(path.join(STANDALONE, 'deploy'), { recursive: true });
  await fsp.copyFile(
    path.join(ROOT, 'lib', 'deploy', 'env-check.js'),
    path.join(STANDALONE, 'deploy', 'env-check.js'),
  );
  await fsp.writeFile(path.join(STANDALONE, 'preflight.mjs'), PREFLIGHT_ENTRY, 'utf8');
  ok('deploy/env-check.js and preflight.mjs');

  // The migration SQL travels WITH the release. The deploy is a `git pull` on a
  // cPanel account, and migrations are the one step that cannot be a file copy —
  // so the files an operator has to import in phpMyAdmin should be sitting in
  // the directory they just pulled, at the version that matches the code, rather
  // than needing to be found in a repository they do not have checked out.
  const sqlSrc = path.join(ROOT, 'db', 'sql');
  if (fs.existsSync(sqlSrc)) {
    await replaceDir(sqlSrc, path.join(STANDALONE, 'db', 'sql'));
    const files = await fsp.readdir(path.join(STANDALONE, 'db', 'sql'));
    ok(`db/sql/ (${files.filter((f) => f.endsWith('.sql')).length} migration files)`);
  } else {
    ok('\x1b[33mdb/sql/ is absent — run `npm run db:sql` so the release carries its migrations\x1b[0m');
  }

  step('Recording what this artifact is');
  const require_ = createRequire(import.meta.url);
  let nextVersion = 'unknown';
  try {
    nextVersion = require_('next/package.json').version;
  } catch { /* not fatal — the field is informational */ }

  const siteUrl = (process.env.SITE_URL || '').trim();
  const buildInfo = {
    // Decides whether an upload directory inside the release directory is
    // survivable. lib/deploy/env-check.js reads this.
    deployModel,
    // The origin the pages were PRERENDERED for. The app refuses to start
    // against a different one. Empty means the build had no SITE_URL, in which
    // case the prerendered canonicals say http://localhost:3000 and this
    // artifact is not deployable anywhere.
    siteUrl,
    commit: git('rev-parse', 'HEAD'),
    commitShort: git('rev-parse', '--short', 'HEAD'),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    dirty: git('status', '--porcelain').length > 0,
    builtAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    next: nextVersion,
    buildId: fs.readFileSync(path.join(STANDALONE, '.next', 'BUILD_ID'), 'utf8').trim(),
  };
  await fsp.writeFile(
    path.join(STANDALONE, 'build-info.json'),
    `${JSON.stringify(buildInfo, null, 2)}\n`,
    'utf8',
  );
  for (const [k, v] of Object.entries(buildInfo)) ok(`${k.padEnd(12)} ${v === '' ? dim('(unset)') : v}`);

  step('Verifying the artifact is complete');
  const problems = [];
  const required = [
    ['server.js', 'the entry point Passenger starts'],
    ['.next/BUILD_ID', 'the build identifier the server reads at boot'],
    ['.next/static', 'every client script and stylesheet'],
    ['public', 'fonts, images and icons'],
    ['node_modules/next', 'the traced runtime'],
    ['build-info.json', 'the artifact identity'],
    ['preflight.mjs', 'the on-server environment check'],
  ];
  for (const [rel, why] of required) {
    if (!fs.existsSync(path.join(STANDALONE, rel))) problems.push(`${rel} is missing — ${why}`);
  }
  // A stylesheet in .next/static is the specific thing whose absence produces
  // the failure that has already cost this project time: pages that render
  // with no styling at all and look like a CSS bug.
  const cssDir = path.join(STANDALONE, '.next', 'static', 'css');
  if (fs.existsSync(cssDir) && fs.readdirSync(cssDir).length === 0) {
    problems.push('.next/static/css is empty — the deployed site would have no stylesheet');
  }
  if (fs.existsSync(path.join(STANDALONE, '.next', 'cache'))) {
    problems.push(
      '.next/cache is inside the artifact — it must not be shipped (it carries the ' +
        "build machine's cached database reads)",
    );
  }
  if (problems.length) {
    console.error('');
    for (const p of problems) console.error(`\x1b[31m    x ${p}\x1b[0m`);
    die(`${problems.length} problem(s) with the artifact.`, 'Do not deploy this.');
  }
  ok(`complete — ${await countFiles(STANDALONE)} files, ${human(await dirSize(STANDALONE))}`);

  const notes = [];
  if (!siteUrl) {
    notes.push(
      'SITE_URL was not set for this build, so every prerendered canonical, hreflang and\n' +
        '      sitemap URL says http://localhost:3000. This artifact is not deployable.\n' +
        '      Rebuild with SITE_URL set to the origin it will be served from.',
    );
  }
  if (process.platform === 'win32') {
    notes.push(
      "Built on Windows. sharp's native bindings are traced into the artifact and the\n" +
        '      win32 binding will throw on the Linux host if anything ever reaches the image\n' +
        '      optimiser. Nothing imports next/image today, so this is latent rather than\n' +
        '      broken — but build on Linux for a release.',
    );
  }
  if (buildInfo.dirty) {
    notes.push('The working tree had uncommitted changes, so this artifact does not correspond\n      to any commit. Fine for staging; do not release it.');
  }
  if (notes.length) {
    console.log(`\n${bold('==>')} Notes`);
    for (const n of notes) console.log(`\x1b[33m    ! ${n}\x1b[0m`);
  }

  if (!wantTar) {
    console.log(`\n${bold('==>')} Done`);
    ok('artifact assembled at .next/standalone');
    ok('run with --tar to produce a release tarball');
    console.log('');
    return;
  }

  step('Writing the release tarball');
  await fsp.mkdir(DIST, { recursive: true });
  const stamp = buildInfo.builtAt.replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
  const name = `dhakabypass-${stamp}-${buildInfo.commitShort || 'nocommit'}`;
  const tarball = path.join(DIST, `${name}.tar.gz`);

  // Staged under its release name so the tarball expands to a single directory
  // that is already named for the release — the server-side procedure is then
  // "extract, point the symlink at it", with no mv and no guessing.
  const staging = path.join(DIST, name);
  await fsp.rm(staging, { recursive: true, force: true });
  await fsp.cp(STANDALONE, staging, { recursive: true, dereference: true });

  try {
    execFileSync('tar', ['-czf', tarball, '-C', DIST, name], { stdio: 'inherit' });
  } catch {
    die(
      'could not run `tar`.',
      'Install tar, or copy .next/standalone to the server by another means. On Windows, ' +
        'use WSL or Git Bash.',
    );
  }
  await fsp.rm(staging, { recursive: true, force: true });

  const size = (await fsp.stat(tarball)).size;
  // A checksum so the operator can prove the bytes that arrived are the bytes
  // that left. A truncated upload otherwise surfaces as a mystery at boot.
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256').update(await fsp.readFile(tarball)).digest('hex');
  await fsp.writeFile(`${tarball}.sha256`, `${hash}  ${name}.tar.gz\n`, 'utf8');

  ok(`${path.relative(ROOT, tarball)}   ${human(size)}`);
  ok(`sha256 ${hash}`);
  console.log(`\n${bold('==>')} Next`);
  ok(`upload:   scp -P <port> ${path.relative(ROOT, tarball)} <user>@<host>:~/releases/`);
  ok('then follow docs/deployment/2026-09-04-deploy-runbook.md');
  console.log('');
}

/**
 * The preflight entry point written into the artifact.
 *
 * Deliberately tiny and dependency-free: it runs on a shared host with the
 * system Node and nothing installed, from inside a directory that contains
 * compiled output rather than source.
 */
const PREFLIGHT_ENTRY = `#!/usr/bin/env node
/**
 * Check this release's environment WITHOUT starting the app.
 *
 *   cd <release directory>
 *   node preflight.mjs
 *
 * Exit 0 means the app will boot. Exit 1 means it will refuse to, and the
 * report says why and how to fix it. Written into this artifact by
 * scripts/package-standalone.mjs — edit that, not this.
 *
 * Reads the environment as the app will see it: the real process environment
 * first, then a .env file sitting beside this script, which is how the
 * standalone server picks up values on a host whose panel cannot inject them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkEnvironment, checkMediaRootWritable, formatReport } from './deploy/env-check.js';

const dir = path.dirname(new URL(import.meta.url).pathname);
const env = { ...process.env };

for (const f of ['.env', '.env.local']) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i === -1) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (env[k] === undefined) env[k] = v;
  }
}

// preflight is run to check a PRODUCTION deployment; the app itself gates on
// NODE_ENV, which the generated server sets for you at boot.
env.NODE_ENV = 'production';

let buildInfo = null;
try {
  buildInfo = JSON.parse(fs.readFileSync(path.join(dir, 'build-info.json'), 'utf8'));
} catch {}

const result = checkEnvironment({ env, cwd: dir, buildInfo });
if (!result.problems.some((p) => p.key === 'MEDIA_ROOT') && env.MEDIA_ROOT) {
  result.problems.push(...(await checkMediaRootWritable(env.MEDIA_ROOT)));
}

if (buildInfo) {
  console.log('');
  console.log(\`  release  \${buildInfo.commitShort || '?'} on \${buildInfo.branch || '?'}, built \${buildInfo.builtAt || '?'}\`);
  console.log(\`  built for origin  \${buildInfo.siteUrl || '(unset)'}\`);
}

process.stdout.write(
  formatReport(result, { heading: 'DHAKA BYPASS — preflight', cwd: dir }),
);
process.exit(result.problems.length ? 1 : 0);
`;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
