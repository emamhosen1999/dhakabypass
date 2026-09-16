import { pickLocale } from '../lib/i18n/pick-locale.js';

/**
 * The bare domain, in the reader's language.
 *
 * This used to be four entries in next.config.mjs redirects(). They worked,
 * and then the HTTP cache defeated them (navigation audit NAV-I18N-01): a
 * config redirect carries no Cache-Control, so a browser or a proxy that had
 * seen `/ -> /en` once served it again to a reader who had since chosen
 * Bangla. headers() cannot fix that — Next does not attach custom headers to
 * a config redirect — so the redirect is a route handler, where the headers
 * are ours: no-store, and Vary on the cookie and the language.
 *
 * Temporary (307), because the answer depends on the reader; each language
 * keeps its own address, which hreflang tells search engines about.
 */
export const dynamic = 'force-dynamic';

export function GET(request) {
  const locale = pickLocale({
    cookie: request.cookies.get('db_locale')?.value,
    acceptLanguage: request.headers.get('accept-language'),
  });
  return new Response(null, {
    status: 307,
    headers: {
      Location: `/${locale}`,
      'Cache-Control': 'no-store',
      Vary: 'Cookie, Accept-Language',
    },
  });
}

export const HEAD = GET;
