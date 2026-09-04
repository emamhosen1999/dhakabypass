/**
 * Publish the built artifact to a deploy branch, so the server updates itself
 * with `git pull` and needs no SSH, no npm, no build toolchain, and no manual
 * file shuffling.
 *
 * THE CONTRACT THIS IMPLEMENTS
 *
 *   here:      npm run build && npm run deploy:release -- --target=staging
 *   server:    git pull   (then touch tmp/restart.txt)
 *
 * That is the whole deploy. No directory is created by hand on the server, no
 * folder is copied into another folder, and nothing is uploaded. The one thing
 * that is not automatic is database migrations, which cPanel runs as SQL rather
 * than as Node — see scripts/generate-sql.mjs and db/sql/.
 *
 * WHY THIS WAS IMPOSSIBLE BEFORE
 *
 * The plan documents always described this model, and it is the right one for
 * the host: a memory-limited cPanel account that must never run `next build` or
 * `npm install`, with git available (at a full path — it is not on PATH). What
 * made it impossible was that `.next/` is gitignored, and that
 * `output: 'standalone'` leaves `public/` and `.next/static` OUTSIDE the
 * standalone directory, so there was never a complete thing to commit.
 * scripts/package-standalone.mjs assembles the complete artifact; this commits
 * it somewhere the server can pull from.
 *
 * WHY AN ORPHAN BRANCH, NOT main
 *
 * Every chunk Next emits is content-hashed, so essentially the whole 58 MB
 * artifact changes on every build. On main that would add tens of megabytes per
 * release to the branch people read, and make every review diff useless. The
 * artifact instead goes to `deploy/staging` or `deploy/production`: an orphan
 * branch holding only the built output, sharing no history with main. Main
 * stays clean; the server clones one branch, shallow, and sees only what it
 * needs to run.
 *
 * WHERE THE SERVER PUTS IT — not the web root. `/home/aeos365/dhakabypass.com`
 * is served over HTTP, and a `.git` directory under a served root hands the
 * whole repository to anyone requesting `/.git/config`. The clone belongs in a
 * sibling directory that Passenger points at. A defensive `.htaccess` is
 * committed into the release for the case where that advice is not followed.
 *
 * THE COST, plainly: the deploy branch grows by roughly the artifact size per
 * release, so it is re-orphaned periodically. The runbook says when and how.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const STANDALONE = path.join(ROOT, '.next', 'standalone');
const WORKTREE = path.join(ROOT, 'var', 'release-worktree');

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const target = opt('target', 'staging');
const branch = opt('branch', `deploy/${target}`);
const remote = opt('remote', 'origin');
const dryRun = flag('dry-run');

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const step = (s) => console.log(`\n${bold('==>')} ${s}`);
const ok = (s) => console.log(`    ${s}`);
function die(message, fix) {
  console.error(`\n\x1b[31m    FAILED: ${message}\x1b[0m`);
  if (fix) console.error(`    ${fix}\n`);
  process.exit(1);
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const inTree = (...a) => execFileSync('git', a, { cwd: WORKTREE, encoding: 'utf8', stdio: 'pipe' });
const tryGit = (...a) => {
  try { return { ok: true, out: git(...a) }; } catch (e) { return { ok: false, out: String(e.message || e) }; }
};

if (!['staging', 'production'].includes(target)) {
  die(`unknown target: ${target}`, 'Use --target=staging or --target=production.');
}

step('Checking the artifact');
if (!fs.existsSync(path.join(STANDALONE, 'server.js'))) {
  die('.next/standalone/server.js is missing.', 'Run `npm run build` first.');
}
let info;
try {
  info = JSON.parse(fs.readFileSync(path.join(STANDALONE, 'build-info.json'), 'utf8'));
} catch {
  die(
    'build-info.json is missing from the artifact.',
    'Run `npm run build` — its postbuild step writes it.',
  );
}
for (const rel of ['public', '.next/static', 'preflight.mjs']) {
  if (!fs.existsSync(path.join(STANDALONE, rel))) {
    die(`the artifact is incomplete — ${rel} is missing.`, 'Re-run `npm run build`.');
  }
}
ok(`commit      ${info.commitShort || '(none)'} on ${info.branch || '?'}`);
ok(`built for   ${info.siteUrl || '(unset)'}`);
ok(`built at    ${info.builtAt}  on ${info.platform}, node ${info.node}`);
ok(`deploy      ${info.deployModel || 'replace'}`);

// The single most damaging mistake available here is shipping an artifact whose
// prerendered canonicals name the wrong origin. `next build` writes SITE_URL
// into every prerendered page and into the sitemap, so an artifact belongs to
// exactly one origin and cannot be promoted between targets.
if (!info.siteUrl) {
  die(
    'this artifact was built with no SITE_URL.',
    'Every prerendered canonical, hreflang and sitemap URL in it says ' +
      'http://localhost:3000. Rebuild with SITE_URL set to the origin this target serves.',
  );
}
if (info.deployModel !== 'git-pull') {
  die(
    `this artifact was packaged for a '${info.deployModel}' deploy, not a git pull.`,
    'Rebuild without --deploy-model, or pass --deploy-model=git-pull to the packaging step. ' +
      'The model decides whether the app treats uploads inside the release directory as safe.',
  );
}
if (info.dirty && !flag('allow-dirty')) {
  die(
    'the working tree had uncommitted changes when this artifact was built.',
    'The release would not correspond to any commit, so nobody could reproduce it or roll ' +
      'back to it. Commit and rebuild, or pass --allow-dirty for a throwaway staging push.',
  );
}
if (info.platform && !info.platform.startsWith('linux') && !flag('allow-foreign-platform')) {
  die(
    `this artifact was built on ${info.platform}, and the server is linux-x64.`,
    "sharp's native bindings are traced into the artifact, so a Windows or macOS build " +
      'ships bindings the host cannot load. Build on Linux, or pass ' +
      '--allow-foreign-platform if you have verified nothing reaches the image optimiser.',
  );
}
if (target === 'production' && !flag('yes')) {
  die(
    'refusing to publish a production release without --yes.',
    `This puts ${info.siteUrl} on ${branch}, which the live server pulls from. Prove the ` +
      'release on staging first, and re-run with --yes once the client has said go.',
  );
}

step(`Preparing the ${branch} worktree`);
// A worktree keeps this entirely separate from the checkout you are working in:
// no branch switch, no stash, nothing to restore if it fails halfway.
await fsp.rm(WORKTREE, { recursive: true, force: true });
tryGit('worktree', 'prune');

tryGit('fetch', '--depth', '1', remote, branch);
const remoteHas = tryGit('rev-parse', '--verify', `${remote}/${branch}`).ok;
const localHas = tryGit('rev-parse', '--verify', branch).ok;

if (remoteHas || localHas) {
  git('worktree', 'add', '--force', '-B', branch, WORKTREE, remoteHas ? `${remote}/${branch}` : branch);
  ok(`continuing ${branch} from ${remoteHas ? `${remote}/${branch}` : 'the local branch'}`);
} else {
  git('worktree', 'add', '--detach', WORKTREE, 'HEAD');
  inTree('switch', '--orphan', branch);
  ok(`created ${branch} as an orphan branch — no history shared with main`);
}

step('Replacing the branch contents with the artifact');
// Wholesale replacement, not a merge. A chunk left over from a previous release
// is harmless right up until the day a stale file shadows a new one and a page
// renders with a stylesheet from two releases ago.
for (const entry of await fsp.readdir(WORKTREE)) {
  if (entry === '.git') continue;
  await fsp.rm(path.join(WORKTREE, entry), { recursive: true, force: true });
}
await fsp.cp(STANDALONE, WORKTREE, { recursive: true, dereference: true });

// Passenger restarts the app when this file's mtime changes. Git cannot track
// an empty directory, so it ships with a file in it that explains itself —
// without this, the first restart on a fresh clone fails for want of a directory.
await fsp.mkdir(path.join(WORKTREE, 'tmp'), { recursive: true });
await fsp.writeFile(
  path.join(WORKTREE, 'tmp', 'restart.txt'),
  'Touch this file to restart the Passenger app:  touch tmp/restart.txt\n',
  'utf8',
);

// THE FILE THAT MAKES `git pull` A SAFE DEPLOY.
//
// Everything listed here is state that lives in the release directory and must
// outlive a deploy. Git leaves untracked, ignored files alone on pull, on
// checkout and on `reset --hard`, so listing them is what turns "pull the new
// build" into a deploy that does not eat the site's uploaded images or its
// environment file.
await fsp.writeFile(
  path.join(WORKTREE, '.gitignore'),
  [
    '# Runtime state that must survive a deploy.',
    '#',
    '# A pull never deletes untracked files, so anything ignored here persists',
    '# across releases. That is what makes `git pull` a safe deploy for this app',
    '# rather than a destructive one.',
    '',
    '# Uploaded media, when MEDIA_ROOT is left at its default. lib/media.js writes',
    '# here and app/uploads/[...path]/route.js serves it.',
    'var/uploads/',
    '',
    '# The environment file, if the host cannot inject variables another way.',
    '# It holds the database password and AUTH_SECRET and must never be committed.',
    '.env',
    '.env.local',
    '',
    '# Written by the running app: the ISR and unstable_cache store. Never shipped',
    "# (it would bake the build machine's database reads into production) and never",
    '# committed back.',
    '.next/cache/',
    '',
    '# Passenger restart hook — tracked once, then touched in place.',
    'tmp/*.pid',
    '',
  ].join('\n'),
  'utf8',
);

// Belt and braces for the case where somebody later points a document root at
// this directory anyway. The runbook puts the clone outside the web root.
await fsp.writeFile(
  path.join(WORKTREE, '.htaccess'),
  [
    '# This directory is NOT meant to be served directly by Apache — Passenger runs',
    '# the Node app and the clone belongs outside the web root. These rules exist so',
    '# that a misconfiguration cannot leak the git history or the environment file,',
    '# which is how a great many sites have been compromised.',
    'RedirectMatch 404 /\\.git',
    '<FilesMatch "^\\.(env|git)">',
    '  Require all denied',
    '</FilesMatch>',
    '',
  ].join('\n'),
  'utf8',
);

const message = [
  `release(${target}): ${info.commitShort || 'nocommit'} for ${info.siteUrl}`,
  '',
  `source commit: ${info.commit || '(none)'}`,
  `source branch: ${info.branch || '(none)'}`,
  `built at:      ${info.builtAt}`,
  `built on:      ${info.platform}, node ${info.node}, next ${info.next}`,
  `build id:      ${info.buildId}`,
  `origin:        ${info.siteUrl}`,
  '',
  'Built artifact only — no source. Produced by scripts/release-to-branch.mjs.',
].join('\n');

inTree('add', '-A');
const staged = inTree('diff', '--cached', '--numstat');
if (!staged.trim()) {
  ok('byte-identical to the last release — nothing to commit');
} else {
  inTree('commit', '-m', message);
  ok(`committed ${staged.trim().split('\n').length} changed files`);
}

if (dryRun) {
  step('Dry run — not pushing');
  ok(`the release is committed on ${branch} in ${path.relative(ROOT, WORKTREE)}`);
  ok(`push it with:  git -C ${path.relative(ROOT, WORKTREE)} push -u ${remote} ${branch}`);
  console.log('');
  process.exit(0);
}

step(`Pushing ${branch} to ${remote}`);
try {
  execFileSync('git', ['push', '-u', remote, branch], { cwd: WORKTREE, stdio: 'inherit' });
} catch {
  die(
    `could not push ${branch}.`,
    `Push it by hand:  git -C ${path.relative(ROOT, WORKTREE)} push -u ${remote} ${branch}`,
  );
}

tryGit('worktree', 'remove', '--force', WORKTREE);

step('Done');
ok(`${branch} holds the release built for ${info.siteUrl}`);
console.log('');
console.log(`    ${bold('On the server:')}`);
console.log('      cd <app directory>');
console.log('      git pull && node preflight.mjs && touch tmp/restart.txt');
console.log('');
console.log('    First-time setup and the verification steps:');
console.log('      docs/deployment/2026-09-04-deploy-runbook.md');
console.log('');
