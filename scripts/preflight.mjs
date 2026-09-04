/**
 * Check an environment without starting the app.
 *
 *   npm run preflight                       check this checkout's .env.local
 *   SITE_URL=... MEDIA_ROOT=... npm run preflight
 *
 * Exit 0 means a production server would boot with this environment; exit 1
 * means it would refuse to, and the report says why and how to fix it.
 *
 * This is the repository-side copy, used while preparing a release. The
 * artifact carries its own generated `preflight.mjs` for running ON the server
 * — see scripts/package-standalone.mjs. Both call the same checks in
 * lib/deploy/env-check.js, so what you verify here is what the server enforces.
 *
 * Why a separate script at all, when the app already refuses to start: because
 * finding out at boot means finding out during the deploy window, with the site
 * down. This can be run against the intended values days beforehand.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from './load-env.mjs';
import {
  checkEnvironment,
  checkMediaRootWritable,
  formatReport,
} from '../lib/deploy/env-check.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// The release directory the app would run from. Passenger sets the working
// directory to the artifact root, so that is what MEDIA_ROOT must sit outside
// of. Locally we can only approximate it with the checkout, which is the right
// approximation: a MEDIA_ROOT inside the checkout is wrong for the same reason.
const cwdArg = process.argv.find((a) => a.startsWith('--release-dir='));
const releaseDir = cwdArg ? path.resolve(cwdArg.slice('--release-dir='.length)) : ROOT;

loadEnv();

// The checks are about production. Without this, a local run would report
// nothing at all and give a false all-clear.
const env = { ...process.env, NODE_ENV: 'production' };

let buildInfo = null;
for (const candidate of [
  path.join(releaseDir, 'build-info.json'),
  path.join(ROOT, '.next', 'standalone', 'build-info.json'),
]) {
  try {
    buildInfo = JSON.parse(fs.readFileSync(candidate, 'utf8'));
    break;
  } catch {
    buildInfo = null;
  }
}

const result = checkEnvironment({ env, cwd: releaseDir, buildInfo });
if (!result.problems.some((p) => p.key === 'MEDIA_ROOT') && env.MEDIA_ROOT) {
  result.problems.push(...(await checkMediaRootWritable(env.MEDIA_ROOT)));
}

if (buildInfo) {
  console.log('');
  console.log(`  artifact  ${buildInfo.commitShort || '?'} on ${buildInfo.branch || '?'}, built ${buildInfo.builtAt || '?'}`);
  console.log(`  built for origin  ${buildInfo.siteUrl || '(unset)'}`);
}

process.stdout.write(
  formatReport(result, { heading: 'DHAKA BYPASS — preflight', cwd: releaseDir }),
);

if (result.problems.length) {
  console.log('  This environment would NOT boot a production server.\n');
}

process.exit(result.problems.length ? 1 : 0);
