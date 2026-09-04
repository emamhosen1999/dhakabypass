import { headers } from 'next/headers';
import { siteOrigin } from '../lib/seo/site.js';

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
 * robots.txt cannot be correct for two hosts, and a robots.txt is a handful of
 * bytes with no database behind it.
 */
export const dynamic = 'force-dynamic';

export default async function robots() {
  const origin = siteOrigin();
  const host = (await headers()).get('host') || '';
  const isAdminHost = host.split(':')[0].toLowerCase().startsWith('admin.');

  if (isAdminHost) {
    // No sitemap line either — there is nothing on this host worth indexing,
    // and pointing a crawler at the public sitemap from here would invite it
    // to fetch public URLs through the admin hostname.
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Reachable on the public host too, via the /admin path.
          '/admin',
          // NextAuth callbacks and the admin's JSON endpoints. Nothing here
          // renders, and every one of them is a pointless crawl.
          '/api/',
          // The legacy routes are deliberately NOT disallowed. They are absent
          // from the sitemap because they are being replaced, but they must
          // stay crawlable so that the 301s planned for cutover can actually
          // be seen and followed — see lib/seo/routes.js.
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
