import { absoluteUrl } from './site.js';
import { resolveTranslation } from '../content/resolve.js';

/**
 * A share card for every page (UI audit UI-I18N-01, concession audit
 * CON-SEO-F-01): no page had an og:image and many had no description, so a
 * link pasted into WhatsApp or Facebook — the channels most road users are on —
 * showed a bare URL.
 *
 * Nothing here is typed twice. The description falls back to the first prose
 * on the page; the image to the page's own hero or first picture, then the
 * site-wide sharing image, then a card this site draws for the page itself.
 * Pure over already-loaded rows, so it is testable without a database.
 */
/**
 * The card this site draws for a page that has no picture of its own (E3).
 *
 * The old fallback was one 686x386 photograph on every URL — under the
 * 1200x630 every scraper asks for, the same image in all three languages,
 * and saying nothing about the page. The route renders the page's own title
 * in its own script instead.
 */
export const OG_CARD_ROUTE = '/api/public/og';
export const OG_CARD_SIZE = Object.freeze({ width: 1200, height: 630 });

/** The Open Graph locale for each of the three languages. */
const OG_LOCALES = Object.freeze({ en: 'en_GB', bn: 'bn_BD', zh: 'zh_CN' });

/** The card URL for one page. The route resolves the title itself. */
export const ogCardUrl = (path, locale) =>
  `${OG_CARD_ROUTE}?path=${encodeURIComponent(path)}&locale=${encodeURIComponent(locale)}`;
const IMAGE_FIELDS = ['image', 'backgroundImage', 'poster', 'photo'];
const TEXT_FIELDS = ['standfirst', 'lede', 'intro', 'body', 'text', 'summary'];

const strip = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function firstProse(blocks, locale) {
  for (const block of blocks || []) {
    const resolved = resolveTranslation(block.translations, locale);
    if (!resolved) continue;
    for (const f of TEXT_FIELDS) {
      const text = strip(resolved.data?.[f]);
      if (text.length >= 40) return text.length > 155 ? `${text.slice(0, 152).replace(/\s+\S*$/, '')}…` : text;
    }
  }
  return '';
}

export function firstImage(blocks, locale) {
  for (const block of blocks || []) {
    const resolved = resolveTranslation(block.translations, locale);
    if (!resolved) continue;
    for (const f of IMAGE_FIELDS) {
      const v = resolved.data?.[f];
      if (typeof v === 'string' && /^(\/|https?:\/\/)/.test(v) && /\.(webp|jpe?g|png)(\?|$)/i.test(v)) return v;
    }
    const items = Array.isArray(resolved.data?.items) ? resolved.data.items : [];
    for (const it of items) {
      const v = it && typeof it.image === 'string' ? it.image : '';
      if (/^(\/|https?:\/\/)/.test(v) && /\.(webp|jpe?g|png)(\?|$)/i.test(v)) return v;
    }
  }
  return '';
}

/**
 * Adds openGraph and twitter to a Next metadata object.
 * `page`: { title, description, ogImage } already resolved for the locale.
 * `site`: { title, ogImage } from the SEO settings.
 */
export function withSocialCard(metadata, { page = {}, site = {}, blocks = [], locale = 'en', path = '/' } = {}) {
  // A title may arrive as { absolute } from brandedTitle. Passed straight
  // through it renders as [object Object] in og:title.
  const own = metadata.title && typeof metadata.title === 'object' ? metadata.title.absolute : metadata.title;
  const title = own || page.title || site.title || '';
  const description = metadata.description || page.description || firstProse(blocks, locale) || site.description || '';
  const chosen = metadata.openGraph?.images?.[0]?.url || page.ogImage || firstImage(blocks, locale) || site.ogImage || '';
  // Dimensions are stated only for the card this site drew. An operator's
  // upload is whatever size it is, and announcing 1200x630 for a 686x386
  // photograph is how a share card ends up letterboxed.
  const imageEntry = chosen
    ? { url: absoluteUrl(chosen) }
    : { url: absoluteUrl(ogCardUrl(path, locale)), ...OG_CARD_SIZE, alt: title };
  const out = { ...metadata };
  if (!out.description && description) out.description = description;
  out.openGraph = {
    ...(out.openGraph || {}),
    type: 'website',
    title: out.openGraph?.title || title,
    description: out.openGraph?.description || description,
    url: absoluteUrl(path),
    siteName: site.title || undefined,
    locale: OG_LOCALES[locale] || OG_LOCALES.en,
    // The same page exists in the other two languages, and a scraper that
    // knows it can offer the reader theirs.
    alternateLocale: Object.entries(OG_LOCALES).filter(([k]) => k !== locale).map(([, v]) => v),
    images: [imageEntry],
  };
  out.twitter = { card: 'summary_large_image', title, description, images: [imageEntry.url] };
  return out;
}
