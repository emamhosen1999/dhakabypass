/**
 * Which analytics provider this deployment uses, if any.
 *
 * Pure and dependency-free: it takes an environment and returns a description,
 * so every combination can be tested without a browser, a network, or a running
 * server — and so the same function decides what the page renders and what the
 * preflight check warns about.
 *
 * ---------------------------------------------------------------------------
 * Off by default, and configured rather than hardcoded
 * ---------------------------------------------------------------------------
 * `ANALYTICS_PROVIDER` unset means no analytics script is rendered at all. That
 * is the correct default for staging, for a developer machine, and for any
 * environment nobody has thought about — the failure mode of a hardcoded
 * measurement ID is that staging traffic silently pollutes the production
 * numbers, and nobody notices because the numbers still look plausible.
 *
 * ---------------------------------------------------------------------------
 * Cookies, and why the provider choice is not just a preference
 * ---------------------------------------------------------------------------
 * `plausible` and `umami` are cookieless: they set no identifiers and store
 * nothing on the visitor's device, so they need no consent banner and no
 * consent record.
 *
 * `ga4` is not. Google Analytics sets cookies and processes personal data, and
 * running it without consent is a legal exposure for DBEDC rather than a
 * technical preference. So when it is selected, this module reports
 * `requiresConsent: true`, the page renders Google Consent Mode v2 with every
 * storage type DENIED before the tag loads, and no measurement happens until a
 * visitor actively agrees. Choosing ga4 therefore also chooses a consent
 * banner; the alternative — quietly measuring anyway — is not offered here.
 *
 * ---------------------------------------------------------------------------
 * A note on WHEN this is read
 * ---------------------------------------------------------------------------
 * The localised pages are prerendered by `next build`, so whatever this returns
 * at build time is baked into the HTML — exactly as `SITE_URL` is, and for the
 * same reason (see scripts/package-standalone.mjs). Changing the provider means
 * rebuilding, not just restarting. The deploy runbook says so beside SITE_URL.
 */

/** Providers that store nothing on the visitor's device. */
const COOKIELESS = new Set(['plausible', 'umami']);

/** Everything this module knows how to render. */
export const PROVIDERS = ['none', 'plausible', 'umami', 'ga4'];

function clean(value) {
  return String(value == null ? '' : value).trim();
}

/**
 * @returns {{
 *   enabled: boolean, provider: string, requiresConsent: boolean,
 *   siteId: string, scriptUrl: string, problems: string[],
 * }}
 *   `enabled` is false whenever nothing should be rendered — including when a
 *   provider is named but misconfigured, because a half-configured tag is a
 *   broken page rather than partial measurement.
 */
export function analyticsConfig(env = {}) {
  const provider = clean(env.ANALYTICS_PROVIDER).toLowerCase() || 'none';
  const siteId = clean(env.ANALYTICS_SITE_ID);
  const scriptUrl = clean(env.ANALYTICS_SCRIPT_URL);
  const off = {
    enabled: false, provider: 'none', requiresConsent: false,
    siteId: '', scriptUrl: '', problems: [],
  };

  if (provider === 'none') return off;

  if (!PROVIDERS.includes(provider)) {
    return {
      ...off,
      problems: [
        `ANALYTICS_PROVIDER is "${provider}", which is not one of: ${PROVIDERS.join(', ')}. `
        + 'No analytics will be recorded.',
      ],
    };
  }

  const problems = [];
  if (!siteId) {
    problems.push(
      `ANALYTICS_PROVIDER is "${provider}" but ANALYTICS_SITE_ID is not set, so nothing can `
      + 'be recorded. Set it, or set ANALYTICS_PROVIDER=none.',
    );
  }
  // Self-hosted Plausible and Umami are the normal case for both, and each
  // instance has its own script URL. There is no sensible default to guess:
  // a wrong one 404s silently and measures nothing.
  if ((provider === 'plausible' || provider === 'umami') && !scriptUrl) {
    problems.push(
      `ANALYTICS_PROVIDER is "${provider}" but ANALYTICS_SCRIPT_URL is not set. Point it at `
      + 'the script on your analytics instance.',
    );
  }
  if (scriptUrl && !/^https:\/\//i.test(scriptUrl)) {
    problems.push(
      `ANALYTICS_SCRIPT_URL must be an https URL. A script loaded over http on an https page `
      + 'is blocked by the browser and measures nothing.',
    );
  }

  if (problems.length) return { ...off, problems };

  return {
    enabled: true,
    provider,
    requiresConsent: !COOKIELESS.has(provider),
    siteId,
    scriptUrl,
    problems: [],
  };
}
