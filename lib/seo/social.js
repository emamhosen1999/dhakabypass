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
 * site-wide sharing image, then the corridor aerial that ships with the site.
 * Pure over already-loaded rows, so it is testable without a database.
 */
export const FALLBACK_IMAGE = '/bg-hero.webp';
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
  const title = metadata.title || page.title || site.title || '';
  const description = metadata.description || page.description || firstProse(blocks, locale) || site.description || '';
  const image = metadata.openGraph?.images?.[0]?.url || page.ogImage || firstImage(blocks, locale) || site.ogImage || FALLBACK_IMAGE;
  const out = { ...metadata };
  if (!out.description && description) out.description = description;
  out.openGraph = {
    ...(out.openGraph || {}),
    type: 'website',
    title: out.openGraph?.title || title,
    description: out.openGraph?.description || description,
    url: absoluteUrl(path),
    siteName: site.title || undefined,
    locale: { en: 'en_GB', bn: 'bn_BD', zh: 'zh_CN' }[locale] || 'en_GB',
    images: [{ url: absoluteUrl(image) }],
  };
  out.twitter = { card: 'summary_large_image', title, description, images: [absoluteUrl(image)] };
  return out;
}
