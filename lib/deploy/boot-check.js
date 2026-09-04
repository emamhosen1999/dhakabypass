/**
 * The boot-time environment gate: converts the deployment's silent failures
 * into a refusal to start.
 *
 * Every variable checked here fails the same way — the app boots, answers 200,
 * and is quietly wrong for as long as nobody looks. Uploads written into a
 * directory the next deploy deletes. A sitemap full of localhost URLs. A front
 * page reading "No home page has been created yet." The reasoning for each, and
 * the line between a problem and a warning, is in ./env-check.js.
 *
 * WHY REFUSING TO START IS THE RIGHT FAILURE. On this host the alternative is
 * not a smaller problem, it is no signal at all: there is no error tracking and
 * no uptime check on content correctness, so a booted-but-misconfigured site
 * looks exactly like a healthy one from cPanel. An app that will not start is
 * visible immediately, says why in the log, and is fixed by editing the
 * environment and restarting.
 *
 * Node-only. instrumentation.js guarantees that by importing this module inside
 * a NEXT_RUNTIME check — see the note there before moving anything.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  checkEnvironment,
  checkMediaRootWritable,
  formatReport,
  isProductionServer,
} from './env-check.js';

/**
 * Read the artifact's identity, written by scripts/package-standalone.mjs.
 *
 * Absence is not an error: the app may be running from a plain `next build`
 * rather than a packaged release. Presence enables the check that matters most
 * in practice — that this artifact is being served from the origin its pages
 * were prerendered for.
 */
async function readBuildInfo(cwd) {
  try {
    return JSON.parse(await fs.readFile(path.join(cwd, 'build-info.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function assertBootEnvironment({
  env = process.env,
  cwd = process.cwd(),
  stderr = process.stderr,
  exit = (code) => process.exit(code),
} = {}) {
  // Not a production server: development, a test run, or one of `next build`'s
  // static-generation workers, which also run with NODE_ENV=production. Running
  // the check there would fail every build on a machine without production
  // credentials, and the first thing anyone would do is delete the check.
  if (!isProductionServer(env)) return { checked: false };

  const buildInfo = await readBuildInfo(cwd);
  const result = checkEnvironment({ env, cwd, buildInfo });

  // The one check that touches the disk, and only once the string checks have
  // passed — no point stat-ing a path already known to be wrong.
  if (!result.problems.some((p) => p.key === 'MEDIA_ROOT') && env.MEDIA_ROOT) {
    result.problems.push(...(await checkMediaRootWritable(env.MEDIA_ROOT)));
  }

  if (!result.problems.length) {
    if (result.warnings.length) {
      stderr.write(formatReport(result, { heading: 'DHAKA BYPASS — starting, with warnings', cwd }));
    }
    return { checked: true, started: true, result };
  }

  // An escape hatch, deliberately awkward to type and impossible to set by
  // accident. For one situation only: the site is down, this check is what is
  // holding it down, and you have judged the check to be wrong. It is not a way
  // to defer fixing the environment — the report still prints every time.
  const override = env.DHAKABYPASS_SKIP_ENV_CHECK === 'i-accept-the-risk';

  stderr.write(
    formatReport(result, {
      heading: override
        ? 'DHAKA BYPASS — environment check OVERRIDDEN, starting anyway'
        : 'DHAKA BYPASS — REFUSING TO START',
      cwd,
    }),
  );

  if (override) {
    stderr.write(
      '  DHAKABYPASS_SKIP_ENV_CHECK is set. The problems above are NOT fixed — the app\n' +
        '  is serving with them. Unset it as soon as the real cause is dealt with.\n\n',
    );
    return { checked: true, started: true, overridden: true, result };
  }

  stderr.write(
    '  Fix the problems above and restart (touch tmp/restart.txt).\n' +
      '  To check without starting the app:  node preflight.mjs\n' +
      '  Full procedure: docs/deployment/2026-09-04-deploy-runbook.md\n\n',
  );

  // exit rather than throw: a thrown error here is caught and logged by Next on
  // some paths, which would leave a misconfigured server accepting requests —
  // the exact outcome this module exists to prevent.
  exit(1);
  return { checked: true, started: false, result };
}
