import { ImageResponse } from 'next/og';
import { isLocale, DEFAULT_LOCALE } from '../../../../lib/i18n/locales.js';
import { getPageBySlugCached } from '../../../../lib/content/cache.js';
import { getSeoSettingsCached } from '../../../../lib/seo/cache.js';
import { resolveTranslation } from '../../../../lib/content/resolve.js';
import { cardText, slugFromPath } from '../../../../lib/seo/og-card.js';
import { OG_CARD_SIZE } from '../../../../lib/seo/social.js';
import { SEO_DEFAULTS } from '../../../../lib/seo/settings.js';
import { siteOrigin } from '../../../../lib/seo/site.js';
import { orLog, logError } from '../../../../lib/log.js';

/**
 * The share card, drawn per page (E3).
 *
 * What it replaces: one 686x386 photograph, the same on all 189 URLs and in
 * all three languages, under the 1200x630 every scraper asks for. A page with
 * a picture of its own still uses that picture — this is the fallback, and
 * `withSocialCard` decides which applies.
 *
 * It lives under `/api/public/` because that is the one path under `/api/`
 * robots.txt allows (E7), and `facebookexternalhit` does obey robots.txt: a
 * card at a disallowed URL is a card that never gets fetched.
 *
 * The title is read from the page, never from the query string. A card route
 * that renders whatever text it is handed is a way to put someone else's words
 * under this domain's name.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BRAND = { plate: '#06263D', accent: '#EF8221', ink: '#FFFFFF', muted: '#9FB6C6' };

/** The card, as plain elements: this file has no JSX so the route stays .js. */
function card({ title, brand, domain }) {
  const line = (children, style) => ({ type: 'div', props: { children, style } });
  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', background: BRAND.plate, color: BRAND.ink,
        padding: '72px 80px', fontFamily: 'sans-serif',
      },
      children: [
        line(brand || domain, {
          fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: BRAND.accent,
          display: 'flex',
        }),
        line(title, { fontSize: title.length > 48 ? 64 : 82, fontWeight: 700, lineHeight: 1.15, display: 'flex' }),
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: 24 },
            children: [
              line('', { width: 96, height: 8, background: BRAND.accent, display: 'flex' }),
              line(domain, { fontSize: 28, color: BRAND.muted, display: 'flex' }),
            ],
          },
        },
      ],
    },
  };
}

export async function GET(request) {
  const url = new URL(request.url);
  const asked = url.searchParams.get('locale');
  const locale = isLocale(asked) ? asked : DEFAULT_LOCALE;
  const path = url.searchParams.get('path') || `/${locale}`;

  const slug = slugFromPath(path);
  const [page, site] = await Promise.all([
    slug ? getPageBySlugCached(slug).catch(orLog('og.page_failed', null, { slug })) : Promise.resolve(null),
    getSeoSettingsCached(locale).catch(orLog('og.settings_failed', null)),
  ]);

  const rows = (page?.translations || []).map((tr) => ({
    locale: tr.locale, status: tr.status, data: { title: tr.seo_title || tr.title },
  }));
  const resolved = resolveTranslation(rows, locale);
  const text = cardText({ pageTitle: resolved?.data.title, siteTitle: site?.siteTitle });

  // Scrapers refetch a card whenever a link is pasted again. A day in the
  // reader's cache, a week at the edge: the title changes only when an editor
  // changes it, and a stale card for a day costs nothing.
  const headers = { 'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800' };

  // The domain comes from the configured origin, never from the request.
  // Behind Passenger the request host is the internal bind address, and the
  // first cards served in production read "0.0.0.0:3000".
  const domain = siteOrigin().replace(/^https?:\/\//, '');

  try {
    return new ImageResponse(card({ ...text, domain }), { ...OG_CARD_SIZE, headers });
  } catch (err) {
    // The renderer carries a Latin face and fetches one for any other script,
    // so a Bangla or Chinese card needs outbound HTTPS. Where that is refused,
    // the reader still gets a card with the road name on it rather than a 500
    // and a blank preview.
    logError('og.render_failed', err, { locale });
    return new ImageResponse(card({ title: SEO_DEFAULTS.siteTitle, brand: '', domain }), {
      ...OG_CARD_SIZE, headers,
    });
  }
}
