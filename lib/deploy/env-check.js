/**
 * The production environment check.
 *
 * Every variable this file inspects has the same failure shape: unset, the app
 * still boots, still returns HTTP 200, and does the wrong thing quietly for as
 * long as nobody looks. That is the entire reason this module exists. The
 * deployment readiness review (docs/deployment/2026-09-04-readiness-review.md)
 * catalogues them:
 *
 *   - MEDIA_ROOT unset  -> uploads land inside the release directory and are
 *                          destroyed by the next deploy. The upload succeeds,
 *                          the database row is written, the image serves, and
 *                          it vanishes at the next release with no error.
 *   - SITE_URL unset    -> robots.txt, sitemap.xml, every canonical and every
 *                          hreflang publish http://localhost:3000. Nothing
 *                          throws; the site simply deindexes itself.
 *   - DB_* unset        -> every page renders "No home page has been created
 *                          yet." with a 200 status.
 *
 * So the check is deliberately fatal rather than advisory. A production boot
 * that cannot be correct should not happen at all: an operator who sees the
 * app refuse to start fixes it in a minute, whereas the silent version of the
 * same mistake is discovered weeks later by a search engine.
 *
 * TWO CONSTRAINTS SHAPED THIS FILE, and both are easy to break by accident:
 *
 * 1. It has no imports except `node:path`. The packaging step copies this file
 *    verbatim into the deployed artifact so that `node preflight.mjs` can be
 *    run on the server BEFORE starting the app — the artifact contains compiled
 *    output, not `lib/` source, so anything this file imported would not be
 *    there. Adding an import to a project module will break the shipped
 *    preflight without breaking a single test. See scripts/package-standalone.mjs.
 *
 * 2. Nothing here reads `process.env` or the filesystem on its own. The
 *    environment and the working directory are arguments. That is what lets the
 *    whole matrix be tested without mutating the runner's environment, and it
 *    is why `checkEnvironment` is pure and `checkMediaRootWritable` — the one
 *    check that must touch the disk — is separate and async.
 */

import path from 'node:path';

/**
 * Hostnames that mean "this is not a real deployment". `SITE_URL` pointing at
 * any of them in production is the localhost-sitemap failure, which is the
 * single most expensive silent mistake available here: Google is handed a
 * sitemap of unreachable URLs and drops the site.
 */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

/**
 * Normalise an origin the way `lib/seo/site.js` does, including its deliberate
 * kindness of accepting a bare `dhakabypass.com` and treating it as https —
 * that is the mistake an operator actually makes in a cPanel environment
 * editor, and the SEO module chose not to fail the whole sitemap over it.
 *
 * This duplicates `siteOrigin()` rather than importing it, because of
 * constraint 1 above. The duplication is pinned by a test
 * (tests/unit/deploy-env-check.test.js) that runs a table of inputs through
 * both implementations and asserts they agree, so a future change to one that
 * is not mirrored in the other fails the suite rather than drifting silently.
 *
 * Returns null when the value cannot be parsed at all, where `siteOrigin()`
 * falls back to localhost. The difference is intentional: the SEO module runs
 * inside robots.txt and sitemap.xml, where throwing is a 500, so it must always
 * yield something. This module's entire job is to notice.
 */
export function normalizeOrigin(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

/**
 * Is this a production server actually about to serve requests?
 *
 * `next build` also runs with NODE_ENV=production, and its static-generation
 * workers bootstrap enough of a server to fire the instrumentation hook. If
 * this returned true during a build, every build on a machine without
 * production credentials would fail — which would be a self-inflicted outage
 * of the build itself, and would push people toward disabling the check.
 *
 * NEXT_PHASE is how the two are told apart: `phase-production-build` during
 * `next build`, and absent (or `phase-production-server`) when serving. The
 * absent case must read as "serving", because that is what the generated
 * standalone server does — it sets NODE_ENV and nothing else.
 */
export function isProductionServer(env = {}) {
  if (env.NODE_ENV !== 'production') return false;
  if (env.NEXT_PHASE && env.NEXT_PHASE !== 'phase-production-server') return false;
  return true;
}

function blank(v) {
  return v == null || String(v).trim() === '';
}

/**
 * Is `child` the same path as `parent`, or inside it?
 *
 * Used for the MEDIA_ROOT-inside-the-release-directory check. Compares resolved
 * paths and requires a separator at the boundary, so `/home/a/media-old` is not
 * treated as living inside `/home/a/media`.
 */
export function isInside(parent, child) {
  const p = path.resolve(parent);
  const c = path.resolve(child);
  if (p === c) return true;
  return c.startsWith(p.endsWith(path.sep) ? p : p + path.sep);
}

/**
 * Inspect an environment. Pure: no process.env, no disk, no throwing.
 *
 * @param {object}  o
 * @param {object}  o.env        the environment to inspect
 * @param {string}  o.cwd        the directory the app would run from — on the
 *                               server this is the release directory, which is
 *                               what MEDIA_ROOT must not be inside
 * @param {object=} o.buildInfo  parsed build-info.json from the artifact, when one is
 *                               present. Supplies the origin the pages were prerendered
 *                               for, and `deployModel`, which decides whether an
 *                               in-release-directory MEDIA_ROOT is survivable
 * @returns {{problems: Array, warnings: Array}} each entry
 *          `{ key, message, why, fix }`
 */
export function checkEnvironment({ env = {}, cwd = process.cwd(), buildInfo = null } = {}) {
  const problems = [];
  const warnings = [];
  const problem = (key, message, why, fix) => problems.push({ key, message, why, fix });
  const warn = (key, message, why, fix) => warnings.push({ key, message, why, fix });

  // ---- MEDIA_ROOT ------------------------------------------------------
  // lib/media.js falls back to <cwd>/var/uploads, and whether that fallback is
  // survivable depends entirely on how releases reach the server:
  //
  //   'git-pull'  the release directory is a git checkout updated in place. A
  //               pull or a `git reset --hard` does not touch untracked files,
  //               so an ignored var/uploads/ survives every deploy. The default
  //               is then acceptable, and requiring an operator to create a
  //               directory by hand would be friction with nothing behind it.
  //   'replace'   the release directory is swapped wholesale (tarball, rsync,
  //               a new timestamped directory). The default is then destructive:
  //               every upload since the last deploy is deleted, silently, with
  //               the database rows still pointing at the missing files.
  //
  // The model is recorded in build-info.json at package time. When it is not
  // recorded we assume 'replace', because that is the assumption whose failure
  // mode is a warning rather than lost data.
  const deployModel = (buildInfo && buildInfo.deployModel) || 'replace';
  const inPlace = deployModel === 'git-pull';
  const mediaRoot = env.MEDIA_ROOT;
  const defaultRoot = path.join(cwd, 'var', 'uploads');

  if (blank(mediaRoot)) {
    if (inPlace) {
      warn(
        'MEDIA_ROOT',
        `MEDIA_ROOT is not set — uploads will go to ${defaultRoot}`,
        'This release is deployed by updating a git checkout in place, and a pull does not ' +
          'delete untracked files, so uploads there survive a deploy. Two things still bite: ' +
          'a fresh clone into a new directory starts with an empty media library while the ' +
          'database still references every file, and a host backup that only covers the ' +
          'database will not carry the images.',
        'Fine to leave. To make it robust, set MEDIA_ROOT to a path outside the checkout ' +
          'that the account backup covers, and move the existing files there.',
      );
    } else {
      problem(
        'MEDIA_ROOT',
        'MEDIA_ROOT is not set.',
        `Uploads would fall back to ${defaultRoot} — inside the release directory. This ` +
          'release is deployed by replacing that directory, so every image uploaded through ' +
          'the admin would be deleted by the next deploy, with no error at upload time and ' +
          'no trace afterwards.',
        'Set MEDIA_ROOT to an absolute path OUTSIDE the release directory, e.g. ' +
          '/home/aeos365/media/dhakabypass, and create the directory before starting the app.',
      );
    }
  } else if (!path.isAbsolute(String(mediaRoot))) {
    problem(
      'MEDIA_ROOT',
      `MEDIA_ROOT is not an absolute path: ${mediaRoot}`,
      'A relative path is resolved against the process working directory, which Passenger ' +
        'sets to the release directory — so a relative value is not the path you think you ' +
        'set, and it moves if anything ever changes the working directory.',
      'Use a full path beginning with /.',
    );
  } else if (isInside(cwd, String(mediaRoot))) {
    if (inPlace) {
      warn(
        'MEDIA_ROOT',
        `MEDIA_ROOT is inside the release directory: ${mediaRoot}`,
        'Deploys update this checkout in place and leave untracked files alone, so this ' +
          'survives — provided the path stays untracked and git-ignored. It does not survive ' +
          'a fresh clone into a new directory.',
        'Acceptable as it stands. A path outside the checkout is more robust.',
      );
    } else {
      problem(
        'MEDIA_ROOT',
        `MEDIA_ROOT is inside the release directory: ${mediaRoot}`,
        `The release directory (${cwd}) is replaced wholesale on every deploy. Anything ` +
          'written under it is lost at the next release.',
        'Move MEDIA_ROOT outside the release directory — a sibling such as ' +
          '/home/aeos365/media/dhakabypass, which the deploy never touches and the account ' +
          'backup does.',
      );
    }
  }

  // ---- SITE_URL --------------------------------------------------------
  const siteUrl = env.SITE_URL;
  const origin = normalizeOrigin(siteUrl);
  if (blank(siteUrl)) {
    problem(
      'SITE_URL',
      'SITE_URL is not set.',
      'lib/seo/site.js defaults to http://localhost:3000. robots.txt would advertise a ' +
        'localhost sitemap, and every canonical and hreflang alternate would point at ' +
        'localhost. Nothing errors; the site quietly deindexes itself.',
      'Set SITE_URL to this deployment\'s own absolute origin, e.g. ' +
        'https://staging.dhakabypass.com on staging and https://dhakabypass.com in production.',
    );
  } else if (!origin) {
    problem(
      'SITE_URL',
      `SITE_URL cannot be parsed as a URL: ${siteUrl}`,
      'lib/seo/site.js silently falls back to http://localhost:3000 when the value is ' +
        'unparseable, so this fails exactly like an unset value.',
      'Use a full origin such as https://dhakabypass.com — no path, no trailing slash.',
    );
  } else {
    const host = new URL(origin).hostname;
    if (LOCAL_HOSTNAMES.has(host)) {
      problem(
        'SITE_URL',
        `SITE_URL points at a local address: ${origin}`,
        'Canonicals, hreflang alternates and the sitemap would all publish an address no ' +
          'crawler and no visitor can reach.',
        'Set SITE_URL to the public origin this deployment answers on.',
      );
    }
    if (origin.startsWith('http://')) {
      warn(
        'SITE_URL',
        `SITE_URL uses http, not https: ${origin}`,
        'Canonical URLs would nominate the insecure variant of every page as the one to ' +
          'index, and the site is served over TLS.',
        'Use https:// unless this host genuinely has no certificate.',
      );
    }
    if (!/^https?:\/\//i.test(String(siteUrl).trim())) {
      warn(
        'SITE_URL',
        `SITE_URL has no scheme and was read as ${origin}`,
        'lib/seo/site.js accepts a bare hostname and assumes https. That is deliberate, but ' +
          'it means the value in the environment editor does not match what gets published.',
        `Write it out in full: ${origin}`,
      );
    }
  }

  // ---- SITE_URL against the baked artifact ------------------------------
  // `output: 'standalone'` prerenders /[locale] and /[locale]/travel/* at BUILD
  // time, and generateMetadata runs then — so the origin is written into the
  // prerendered HTML on the build machine. A build with SITE_URL set to a probe
  // value puts that value into 74 files, the sitemap body among them.
  //
  // This is the one failure mode the design note in lib/seo/site.js does not
  // cover: it reasons that SITE_URL is a server variable so the operator can
  // change the domain and restart, which holds for robots.txt (force-dynamic)
  // and not for anything prerendered. The pages carry a 60s revalidate and the
  // sitemap an hour, so a mismatched artifact heals itself eventually — but it
  // serves the wrong origin to whoever arrives first, and it means a staging
  // tarball promoted to production publishes staging URLs.
  //
  // Hence: the artifact records the origin it was built with, and the app
  // refuses to start against a different one.
  const bakedRaw = buildInfo && buildInfo.siteUrl;
  if (!blank(bakedRaw) && origin) {
    const baked = normalizeOrigin(bakedRaw);
    if (baked && baked !== origin) {
      problem(
        'SITE_URL',
        `SITE_URL (${origin}) does not match the origin this artifact was built with (${baked}).`,
        'The localised pages and the sitemap were prerendered at build time and carry the ' +
          'build origin in their canonical and hreflang tags. Serving this artifact from a ' +
          'different origin publishes the wrong URLs until every page revalidates.',
        `Either serve this artifact from ${baked}, or rebuild with SITE_URL=${origin}. ` +
          'An artifact belongs to one origin — do not promote the staging tarball to production.',
      );
    }
  }

  // ---- Database --------------------------------------------------------
  // lib/db.js degrades rather than throwing when the database is unreachable,
  // and that is a deliberate, documented choice for a memory-limited host: a
  // dead query must not take the front door down. It is not a reason to boot
  // with no database CONFIGURED. An outage is transient and self-healing; an
  // empty DB_NAME is a deployment mistake that serves "No home page has been
  // created yet." to the public, indistinguishable from a defaced site.
  const missingDb = ['DB_HOST', 'DB_NAME', 'DB_USER'].filter((k) => blank(env[k]));
  if (missingDb.length) {
    problem(
      'DB',
      `Database configuration is incomplete — not set: ${missingDb.join(', ')}.`,
      'lib/db.js treats an incomplete configuration as "no database" and every reader ' +
        'degrades to safe defaults, so the site would answer every request with HTTP 200 and ' +
        'empty content rather than reporting a fault.',
      'Set DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD in the app environment.',
    );
  } else if (blank(env.DB_PASSWORD)) {
    warn(
      'DB_PASSWORD',
      'DB_PASSWORD is empty.',
      'Valid only if the database user genuinely has no password, which no cPanel MySQL ' +
        'user does. If it is a mistake, every query fails and the site renders empty.',
      'Set DB_PASSWORD to the password of the cPanel database user.',
    );
  }

  // ---- Analytics -------------------------------------------------------
  // A provider named but misconfigured is the silent case: the operator
  // believes analytics is on, no script renders, and nobody finds out until
  // someone asks for a traffic report months later. Duplicated here rather than
  // imported from lib/analytics/config.js for the same reason as the origin
  // normaliser above — this file is copied verbatim into the artifact, where
  // lib/ does not exist. tests/unit/deploy-env-check.test.js pins the two
  // together.
  const provider = String(env.ANALYTICS_PROVIDER || '').trim().toLowerCase();
  if (provider && provider !== 'none') {
    const known = ['plausible', 'umami', 'ga4'];
    const siteId = String(env.ANALYTICS_SITE_ID || '').trim();
    const scriptUrl = String(env.ANALYTICS_SCRIPT_URL || '').trim();
    if (!known.includes(provider)) {
      warn(
        'ANALYTICS_PROVIDER',
        `ANALYTICS_PROVIDER is "${provider}", which is not recognised.`,
        `Nothing will be measured. Known providers: ${known.join(', ')}.`,
        'Set it to one of those, or to none.',
      );
    } else if (!siteId) {
      warn(
        'ANALYTICS_SITE_ID',
        `ANALYTICS_PROVIDER is "${provider}" but ANALYTICS_SITE_ID is not set.`,
        'No analytics script is rendered, so the site looks instrumented and records nothing.',
        'Set ANALYTICS_SITE_ID, or set ANALYTICS_PROVIDER=none.',
      );
    } else if ((provider === 'plausible' || provider === 'umami') && !scriptUrl) {
      warn(
        'ANALYTICS_SCRIPT_URL',
        `ANALYTICS_PROVIDER is "${provider}" but ANALYTICS_SCRIPT_URL is not set.`,
        'Both are normally self-hosted and each instance has its own script URL; there is no '
          + 'default to fall back to, so nothing is rendered.',
        'Point ANALYTICS_SCRIPT_URL at the script on your analytics instance.',
      );
    }
  }

  // ---- Admin -----------------------------------------------------------
  // These are warnings, not problems, and the line is drawn deliberately: they
  // break the admin, not the public site. Refusing to serve the public site
  // because nobody can log in would be a worse trade than booting and saying so.
  if (blank(env.AUTH_SECRET)) {
    warn(
      'AUTH_SECRET',
      'AUTH_SECRET is not set.',
      'NextAuth reads this directly — no file in this repo does — so nothing fails at boot. ' +
        'Every /admin route and /api/auth route will return 500 on first use. The public ' +
        'site is unaffected, which is why this is a warning and not a refusal.',
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  if (blank(env.ADMIN_EMAILS)) {
    warn(
      'ADMIN_EMAILS',
      'ADMIN_EMAILS is empty.',
      'auth.js fails closed on an empty list by design, so no account can sign in to the ' +
        'admin at all. The public site is unaffected.',
      'Set ADMIN_EMAILS to a comma-separated list of the addresses allowed to administer the site.',
    );
  }

  return { problems, warnings };
}

/**
 * The one check that has to touch the disk: MEDIA_ROOT must exist and be
 * writable BEFORE the first upload, not after.
 *
 * `saveUpload` calls `fs.mkdir(dir, { recursive: true })`, so a wrong-but-
 * creatable path is created silently and looks like it worked. That is why
 * existence is verified here rather than left to the first upload to discover.
 *
 * Kept separate from `checkEnvironment` so that the pure matrix stays pure and
 * testable without a filesystem.
 *
 * @returns {Promise<Array>} zero or one problem entry
 */
export async function checkMediaRootWritable(dir, fsPromises) {
  const fs = fsPromises || (await import('node:fs/promises'));
  const entry = (message, why, fix) => [{ key: 'MEDIA_ROOT', message, why, fix }];
  let stat;
  try {
    stat = await fs.stat(dir);
  } catch {
    return entry(
      `MEDIA_ROOT does not exist: ${dir}`,
      'The directory is created on demand by the first upload, so a typo becomes a real ' +
        'directory in the wrong place and nothing ever reports it.',
      `Create it before starting the app:  mkdir -p ${dir} && chmod 750 ${dir}`,
    );
  }
  if (!stat.isDirectory()) {
    return entry(
      `MEDIA_ROOT is not a directory: ${dir}`,
      'Uploads cannot be written under a path that is a file.',
      'Point MEDIA_ROOT at a directory.',
    );
  }
  try {
    // W_OK is 2. Passed as a literal so this file keeps its single import.
    await fs.access(dir, 2);
  } catch {
    return entry(
      `MEDIA_ROOT is not writable by this user: ${dir}`,
      'Uploads would fail at the moment a content editor tries to publish, not now.',
      `Give the application user write permission:  chmod 750 ${dir}`,
    );
  }
  return [];
}

/**
 * Render a report for a terminal or a Passenger log.
 *
 * Written to be impossible to scroll past. The failure this whole module exists
 * to prevent is a message nobody noticed, so the output is banner-framed, says
 * what will happen rather than only what is wrong, and gives the fix inline —
 * an operator reading a cPanel log at the wrong end of a deploy window should
 * not have to find a document.
 */
export function formatReport({ problems = [], warnings = [] } = {}, { heading, cwd } = {}) {
  const line = '='.repeat(76);
  const out = [];
  const block = (mark, e) => {
    out.push(`  ${mark} ${e.message}`);
    if (e.why) out.push(...wrap(e.why, '      why: ', '           '));
    if (e.fix) out.push(...wrap(e.fix, '      fix: ', '           '));
    out.push('');
  };

  out.push('');
  out.push(line);
  out.push(`  ${heading || 'DHAKA BYPASS — environment check'}`);
  if (cwd) out.push(`  release directory: ${cwd}`);
  out.push(line);
  out.push('');

  if (problems.length) {
    out.push(`  ${problems.length} problem${problems.length === 1 ? '' : 's'} — the app must not serve production like this:`);
    out.push('');
    for (const e of problems) block('x', e);
  }
  if (warnings.length) {
    out.push(`  ${warnings.length} warning${warnings.length === 1 ? '' : 's'} — the site will serve, but something is wrong:`);
    out.push('');
    for (const e of warnings) block('!', e);
  }
  if (!problems.length && !warnings.length) {
    out.push('  All checks passed.');
    out.push('');
  }
  out.push(line);
  out.push('');
  return out.join('\n');
}

/** Soft-wrap a long sentence so a log line stays readable at 80 columns. */
function wrap(text, firstPrefix, restPrefix, width = 74) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = firstPrefix;
  let prefix = firstPrefix;
  for (const w of words) {
    if (cur.length + w.length + 1 > width && cur !== prefix) {
      lines.push(cur);
      prefix = restPrefix;
      cur = restPrefix + w;
    } else {
      cur = cur === prefix ? cur + w : `${cur} ${w}`;
    }
  }
  if (cur.trim()) lines.push(cur);
  return lines;
}
