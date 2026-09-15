import { query, withTransaction } from '../db.js';
import { LOCALES } from '../i18n/locales.js';
import { validationError } from '../errors.js';
import { RESERVED_SLUGS, HOME_SLUG, NOT_FOUND_SLUG, isValidSlug, normalizeSlug } from './slug.js';

/**
 * A page's own settings (W7.3): its title and search text in each language, its
 * address, its parent and whether it is published.
 *
 * Changing the address adds a permanent redirect from the old address in every
 * language, so shared links and search results keep working. The home and
 * not-found pages cannot be moved, unpublished or deleted.
 */
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 155;
export const PROTECTED_SLUGS = Object.freeze([HOME_SLUG, NOT_FOUND_SLUG]);

export function isProtectedPage(slug) {
  return PROTECTED_SLUGS.includes(String(slug));
}

export async function getPageForAdmin(id) {
  const rows = await query(
    'SELECT id, slug, parent_id, status, published_at, updated_at, updated_by, owner_department, reviewed_at, review_interval_days, legal_status, legal_approved_by, legal_approved_at FROM pages WHERE id = ? LIMIT 1',
    [Number(id)],
  );
  const page = rows?.[0];
  if (!page) return null;
  const translations = (await query(
    'SELECT locale, title, seo_title, seo_description, og_image, status FROM page_translations WHERE page_id = ?',
    [page.id],
  )) || [];
  return { ...page, translations: Object.fromEntries(translations.map((t) => [t.locale, t])) };
}

/** Parse the settings form. Pure, for tests. */
export function parsePageSettings(formData, current) {
  const slug = isProtectedPage(current.slug) ? current.slug : normalizeSlug(formData.get('slug') || '');
  if (!slug || !isValidSlug(slug)) {
    throw validationError('The address must use English letters, numbers, hyphens and slashes, for example travel/toll.');
  }
  if (slug !== current.slug && RESERVED_SLUGS.includes(slug)) {
    throw validationError(`"${slug}" is reserved and cannot be a page address.`);
  }
  const status = String(formData.get('status') || current.status);
  if (!['draft', 'published'].includes(status)) throw validationError('Choose Draft or Published.');
  if (isProtectedPage(current.slug) && status !== 'published') {
    throw validationError(`The ${current.slug === HOME_SLUG ? 'home' : 'not-found'} page is part of every visit and cannot be unpublished.`);
  }
  const parentRaw = String(formData.get('parent_id') ?? '');
  const parentId = parentRaw === '' ? null : Number(parentRaw);
  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) throw validationError('Choose a parent page.');
  if (parentId !== null && parentId === Number(current.id)) throw validationError('A page cannot be its own parent.');

  const translations = {};
  for (const locale of LOCALES) {
    const title = String(formData.get(`title_${locale}`) ?? '').trim();
    const seoTitle = String(formData.get(`seo_title_${locale}`) ?? '').trim();
    const seoDescription = String(formData.get(`seo_description_${locale}`) ?? '').trim();
    const ogImage = String(formData.get(`og_image_${locale}`) ?? '').trim();
    if (locale === 'en' && !title) throw validationError('The page needs an English title.');
    if (title.length > 255) throw validationError(`The ${locale} title is longer than 255 characters.`);
    if (seoTitle.length > 255) throw validationError(`The ${locale} search title is longer than 255 characters.`);
    if (seoDescription.length > 500) throw validationError(`The ${locale} search description is longer than 500 characters.`);
    if (ogImage && !/^\/[^\s]*$|^https:\/\/[^\s]+$/.test(ogImage)) throw validationError(`The ${locale} sharing image must be a picture from the library or an https:// address.`);
    translations[locale] = { title, seoTitle, seoDescription, ogImage };
  }
  // Content governance (W8C.9): who owns the page, when it was last reviewed
  // and how often it should be. All optional.
  const ownerDepartment = String(formData.get('owner_department') ?? '').trim().slice(0, 120);
  const reviewedRaw = String(formData.get('reviewed_at') ?? '').trim();
  if (reviewedRaw && !/^\d{4}-\d{2}-\d{2}$/.test(reviewedRaw)) throw validationError('The review date must be a date.');
  const intervalRaw = String(formData.get('review_interval_days') ?? '').trim();
  const reviewIntervalDays = intervalRaw === '' ? null : Number(intervalRaw);
  if (reviewIntervalDays !== null && (!Number.isInteger(reviewIntervalDays) || reviewIntervalDays < 1 || reviewIntervalDays > 3650)) {
    throw validationError('Review every: a whole number of days from 1 to 3650, or blank.');
  }
  const legalStatus = String(formData.get('legal_status') ?? current.legal_status ?? '');
  if (!['', 'review', 'approved'].includes(legalStatus)) throw validationError('Choose a legal review state.');
  const legalApprovedBy = String(formData.get('legal_approved_by') ?? '').trim().slice(0, 191);
  if (legalStatus === 'approved' && !legalApprovedBy) {
    throw validationError('Name who approved the page (for example the legal adviser or company secretary) to mark it approved.');
  }
  return { slug, status, parentId, translations, ownerDepartment, reviewedAt: reviewedRaw || null, reviewIntervalDays, legalStatus, legalApprovedBy };
}

export async function savePageSettings(id, input, { actor = '' } = {}) {
  return withTransaction(async (q) => {
    const rows = await q('SELECT id, slug, status FROM pages WHERE id = ? FOR UPDATE', [Number(id)]);
    const page = rows?.[0];
    if (!page) throw validationError('That page no longer exists.');
    const moved = input.slug !== page.slug;
    if (moved) {
      const clash = await q('SELECT id FROM pages WHERE slug = ? AND id <> ? LIMIT 1', [input.slug, page.id]);
      if (clash?.length) throw validationError(`A page already lives at /${input.slug}.`);
      const children = await q('SELECT slug FROM pages WHERE parent_id = ?', [page.id]);
      if (children?.length) {
        throw validationError(`This page has ${children.length} sub-page${children.length === 1 ? '' : 's'}; their addresses start with /${page.slug}. Move them first.`);
      }
    }
    if (input.parentId !== null) {
      const parent = await q('SELECT id FROM pages WHERE id = ? LIMIT 1', [input.parentId]);
      if (!parent?.length) throw validationError('That parent page no longer exists.');
    }
    await q(
      `UPDATE pages SET slug = ?, parent_id = ?, status = ?, updated_by = ?,
         owner_department = ?, reviewed_at = ?, review_interval_days = ?,
         legal_approved_at = CASE WHEN ? = 'approved' AND legal_status <> 'approved' THEN CURDATE() WHEN ? <> 'approved' THEN NULL ELSE legal_approved_at END,
         legal_status = ?, legal_approved_by = ?,
         published_at = CASE WHEN ? = 'published' AND status <> 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
        WHERE id = ?`,
      [input.slug, input.parentId, input.status, String(actor).slice(0, 191),
        input.ownerDepartment || '', input.reviewedAt, input.reviewIntervalDays,
        input.legalStatus ?? '', input.legalStatus ?? '', input.legalStatus ?? '', input.legalStatus === 'approved' ? input.legalApprovedBy : '',
        input.status, page.id],
    );
    for (const locale of LOCALES) {
      const t = input.translations[locale];
      if (!t) continue;
      if (locale !== 'en' && !t.title && !t.seoTitle && !t.seoDescription && !t.ogImage) {
        await q("UPDATE page_translations SET title = '', seo_title = '', seo_description = '', og_image = '' WHERE page_id = ? AND locale = ?", [page.id, locale]);
        continue;
      }
      await q(
        `INSERT INTO page_translations (page_id, locale, title, seo_title, seo_description, og_image, status)
         VALUES (?, ?, ?, ?, ?, ?, 'published')
         ON DUPLICATE KEY UPDATE title = VALUES(title), seo_title = VALUES(seo_title),
           seo_description = VALUES(seo_description), og_image = VALUES(og_image), status = 'published'`,
        [page.id, locale, t.title, t.seoTitle, t.seoDescription, t.ogImage],
      );
    }
    const redirects = [];
    if (moved) {
      for (const locale of LOCALES) {
        const source = `/${locale}/${page.slug}`;
        const destination = `/${locale}/${input.slug}`;
        await q(
          `INSERT INTO redirects (source, destination, status_code) VALUES (?, ?, 301)
           ON DUPLICATE KEY UPDATE destination = VALUES(destination), status_code = 301`,
          [source, destination],
        );
        // A redirect that pointed at the old address now points at the new one.
        await q('UPDATE redirects SET destination = ? WHERE destination = ?', [destination, source]);
        // And a redirect FROM the new address would shadow nothing, but loop.
        await q('DELETE FROM redirects WHERE source = ?', [destination]);
        redirects.push({ source, destination });
      }
    }
    return { oldSlug: page.slug, moved, redirects };
  });
}

/**
 * What deleting a page takes with it and what points at it (audit U3, X2):
 * block and translation counts, sub-pages, menu links and other pages whose
 * blocks link to it.
 */
export async function pageImpact(id) {
  const rows = await query('SELECT id, slug FROM pages WHERE id = ? LIMIT 1', [Number(id)]);
  const page = rows?.[0];
  if (!page) return null;
  const [blocks, texts, children, links, mentions] = await Promise.all([
    query('SELECT COUNT(*) AS n FROM blocks WHERE page_id = ?', [page.id]),
    query('SELECT COUNT(*) AS n FROM block_translations bt JOIN blocks b ON b.id = bt.block_id WHERE b.page_id = ?', [page.id]),
    query('SELECT COUNT(*) AS n FROM pages WHERE parent_id = ?', [page.id]),
    query(
      `SELECT COUNT(*) AS n FROM menu_items WHERE href IN (${LOCALES.map(() => '?').join(',')}, ?)`,
      [...LOCALES.map((l) => `/${l}/${page.slug}`), `/${page.slug}`],
    ),
    query(
      `SELECT COUNT(DISTINCT b.page_id) AS n FROM block_translations bt JOIN blocks b ON b.id = bt.block_id
        WHERE b.page_id <> ? AND (bt.data LIKE ? OR bt.data LIKE ?)`,
      [page.id, `%/${page.slug}"%`, `%/${page.slug}\\\\"%`],
    ),
  ]);
  return {
    slug: page.slug,
    blocks: Number(blocks?.[0]?.n || 0),
    texts: Number(texts?.[0]?.n || 0),
    children: Number(children?.[0]?.n || 0),
    menuLinks: Number(links?.[0]?.n || 0),
    linkingPages: Number(mentions?.[0]?.n || 0),
  };
}

/** pageImpact for many pages in a handful of queries: Map id → impact. */
export async function pageImpacts(pages) {
  const out = new Map();
  if (!pages.length) return out;
  const ids = pages.map((p) => p.id);
  const marks = ids.map(() => '?').join(',');
  const [blocks, texts, children, menu] = await Promise.all([
    query(`SELECT page_id, COUNT(*) AS n FROM blocks WHERE page_id IN (${marks}) GROUP BY page_id`, ids),
    query(`SELECT b.page_id, COUNT(*) AS n FROM block_translations bt JOIN blocks b ON b.id = bt.block_id WHERE b.page_id IN (${marks}) GROUP BY b.page_id`, ids),
    query(`SELECT parent_id, COUNT(*) AS n FROM pages WHERE parent_id IN (${marks}) GROUP BY parent_id`, ids),
    query('SELECT href FROM menu_items'),
  ]);
  const count = (rows, key) => new Map((rows || []).map((r) => [r[key], Number(r.n)]));
  const b = count(blocks, 'page_id');
  const t = count(texts, 'page_id');
  const c = count(children, 'parent_id');
  const hrefs = (menu || []).map((r) => String(r.href || ''));
  for (const p of pages) {
    const targets = new Set([`/${p.slug}`, ...LOCALES.map((l) => `/${l}/${p.slug}`)]);
    out.set(p.id, {
      slug: p.slug,
      blocks: b.get(p.id) || 0,
      texts: t.get(p.id) || 0,
      children: c.get(p.id) || 0,
      menuLinks: hrefs.filter((h) => targets.has(h)).length,
      linkingPages: 0,
    });
  }
  return out;
}

export function pageDeleteQuestion(title, impact) {
  if (!impact) return `Delete the page "${title}"?`;
  const parts = [`Delete the page "${title}" (/${impact.slug})?`, ''];
  if (impact.children) parts.push(`It has ${impact.children} sub-page${impact.children === 1 ? '' : 's'}; move or delete them first.`);
  parts.push(`Its ${impact.blocks} block${impact.blocks === 1 ? '' : 's'} (${impact.texts} texts across the languages) go with it.`);
  if (impact.menuLinks) parts.push(`${impact.menuLinks} menu link${impact.menuLinks === 1 ? '' : 's'} point at it and will lead nowhere.`);
  if (impact.linkingPages) parts.push(`${impact.linkingPages} other page${impact.linkingPages === 1 ? ' links' : 's link'} to it.`);
  parts.push('', 'It goes to the trash, where it can be restored.');
  return parts.join('\n');
}

/** Pages whose review is overdue, or never done although an interval is set. */
export async function pagesDueForReview() {
  const rows = await query(
    `SELECT p.id, p.slug, p.owner_department, p.reviewed_at, p.review_interval_days, COALESCE(t.title, '') AS title
       FROM pages p LEFT JOIN page_translations t ON t.page_id = p.id AND t.locale = 'en'
      WHERE p.review_interval_days IS NOT NULL
        AND (p.reviewed_at IS NULL OR DATE_ADD(p.reviewed_at, INTERVAL p.review_interval_days DAY) < CURDATE())
      ORDER BY p.reviewed_at IS NULL DESC, p.reviewed_at ASC, p.slug`,
  );
  return rows || [];
}
