#!/usr/bin/env node
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
import { fileURLToPath } from 'node:url';
import { checkEnvironment, checkMediaRootWritable, formatReport } from './deploy/env-check.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const env = { ...process.env };

for (const f of ['.env', '.env.local']) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
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
  console.log(`  release  ${buildInfo.commitShort || '?'} on ${buildInfo.branch || '?'}, built ${buildInfo.builtAt || '?'}`);
  console.log(`  built for origin  ${buildInfo.siteUrl || '(unset)'}`);
}

process.stdout.write(
  formatReport(result, { heading: 'DHAKA BYPASS — preflight', cwd: dir }),
);
process.exit(result.problems.length ? 1 : 0);
