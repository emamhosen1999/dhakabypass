/**
 * Advertising configuration, read from the server environment.
 *
 * Off unless `ADSENSE_CLIENT` is set, in the same way analytics is off unless
 * `ANALYTICS_PROVIDER` is: a publisher ID hardcoded in the repository would
 * put staging impressions into the production account, which is an invalid
 * traffic complaint rather than a bug report.
 *
 * WHERE ADS MAY NOT GO.
 *
 * `NEVER_ADS` is a default, not a lock: an operator places ad blocks from
 * /admin, so the CMS already decides where they appear. What this does is
 * stop an ad rendering on the pages where it would do the most damage even
 * if someone places a block there by accident — the emergency numbers, the
 * grievance form, the statutory disclosures and the toll rates fixed by
 * government notification. A driver on a hard shoulder should not be shown a
 * loan advertisement beside the number they are dialling, and an auditor
 * reading the citizen charter should not find one either.
 *
 * `ADS_ALLOW_EVERYWHERE=1` overrides it, because the decision belongs to
 * DBEDC rather than to this file.
 */

/** Page slugs, and slug prefixes, that carry no advertising by default. */
export const NEVER_ADS = Object.freeze([
  'travel/breakdown',
  'travel/advisories',
  'travel/locate',
  'grievances',
  'contact',
  'disclosures',
  'travel/toll',
  'travel/toll-dispute',
  'legal',
  'privacy',
  'terms',
  'accessibility',
]);

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Whether a page may carry advertising.
 * A prefix match, so `disclosures` covers `disclosures/tariff` and the rest.
 */
export function adsAllowedOn(slug, env = process.env) {
  if (clean(env.ADS_ALLOW_EVERYWHERE) === '1') return true;
  const path = clean(slug).replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!path) return true;
  return !NEVER_ADS.some((blocked) => path === blocked || path.startsWith(`${blocked}/`));
}

/**
 * The publisher account, or null when advertising is off.
 * `client` is the `ca-pub-…` ID; `testMode` renders unfilled placeholders so
 * a layout can be checked without generating impressions.
 */
export function adsConfig(env = process.env) {
  const client = clean(env.ADSENSE_CLIENT);
  if (!client) return { enabled: false, client: '', testMode: false };
  if (!/^ca-pub-\d{10,20}$/.test(client)) {
    return { enabled: false, client: '', testMode: false, problem: `ADSENSE_CLIENT is "${client}", which is not a ca-pub-… publisher ID.` };
  }
  return { enabled: true, client, testMode: clean(env.ADSENSE_TEST) === '1' };
}
