import { headers } from 'next/headers';
import { siteOrigin } from '../lib/seo/site.js';
import { siteSeoCached } from '../lib/seo/cache.js';
import { robotsRulesFor } from '../lib/seo/settings.js';

/**
 * `/robots.txt`.
 *
 * Two hosts are served by this one deployment. `middleware.js` rewrites
 * `admin.<domain>/*` onto the `/admin/*` route tree, so on the admin host the
 * login screen sits at `/` — a `Disallow: /admin` written for the public host
 * would not match a single URL there. The host is therefore checked, and the
 * admin subdomain is disallowed wholesale.
 *
 * Reading `headers()` makes this route dynamic. That is the point: one static
 * robots.txt cannot be correct for two hosts.
 *
 * The RULES are now operator-editable (W1.24). Two things previously required a
 * developer and a deploy: adding a path to `Disallow`, and blocking the whole
 * site before launch. Both are settings at /admin/settings now, and
 * `robotsRulesFor` in lib/seo/settings.js holds the logic so the admin-host
 * rule and the pre-launch switch are testable without a request.
 *
 * A failed read degrades to the built-in rules, never to a blank file. An empty
 * robots.txt means "crawl everything", which on the admin host is the opposite
 * of what this route exists to say.
 */
export const dynamic = 'force-dynamic';

export default async function robots() {
  const origin = siteOrigin();
  const host = (await headers()).get('host') || '';
  const isAdminHost = host.split(':')[0].toLowerCase().startsWith('admin.');

  // On the admin host the answer does not depend on any setting - there is
  // nothing here worth indexing whatever an operator typed - so it is returned
  // without a read at all. No sitemap line either: pointing a crawler at the
  // public sitemap from here would invite it to fetch public URLs through the
  // admin hostname.
  if (isAdminHost) {
    return robotsRulesFor({ siteOrigin: origin, isAdminHost: true });
  }

  // The legacy routes are deliberately NOT disallowed, and an operator cannot
  // accidentally add them - see BUILT_IN_DISALLOW in lib/seo/settings.js and
  // the header of lib/seo/routes.js. They now answer 301, and they must stay
  // crawlable so those redirects can be seen and followed.
  const seo = await siteSeoCached('en');
  return robotsRulesFor({ siteOrigin: origin, isAdminHost: false, seo });
}
