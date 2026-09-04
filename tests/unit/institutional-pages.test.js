/**
 * The institutional page content.
 *
 * These pages are seeded into the database and then edited by DBEDC through the
 * admin, so what is tested here is the SOURCE — the thing a future edit to
 * lib/institutional/pages.js could break before anyone sees a rendered page.
 *
 * The rules being enforced are the project's, not generic hygiene:
 *
 *   - no figure that is not confirmed in the source-data documents
 *   - all three locales on every block, or the reader gets English
 *   - no link that does not go anywhere
 *   - no locale prefix baked into an authored href
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { INSTITUTIONAL_PAGES } from '../../lib/institutional/pages.js';
import { getBlock } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { localeHref } from '../../lib/blocks/href.js';
import { LOCALES } from '../../lib/i18n/locales.js';

registerAllBlocks();

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const slugs = INSTITUTIONAL_PAGES.map((p) => p.slug);

/** Every string a reader could see, flattened out of a block's data. */
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) strings(v, out);
  return out;
}

function allStrings(page, locale) {
  const out = [];
  for (const b of page.blocks) if (b.data[locale]) strings(b.data[locale], out);
  if (page.meta[locale]) strings(page.meta[locale], out);
  return out;
}

/** Authored hrefs, from any field whose name ends in Href. */
function hrefs(value, out = []) {
  if (Array.isArray(value)) for (const v of value) hrefs(v, out);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (/Href$/.test(k) && typeof v === 'string') out.push(v);
      else hrefs(v, out);
    }
  }
  return out;
}

describe('page structure', () => {
  it('has the ten institutional pages, each with a unique slug', () => {
    expect(slugs).toHaveLength(10);
    expect(new Set(slugs).size).toBe(10);
  });

  it.each(slugs)('%s has blocks, and every one is a registered type', (slug) => {
    const page = INSTITUTIONAL_PAGES.find((p) => p.slug === slug);
    expect(page.blocks.length).toBeGreaterThan(0);
    for (const b of page.blocks) {
      // A type that is not in the registry renders as nothing at all, and the
      // page loses a section silently.
      expect(getBlock(b.type), `block type ${b.type}`).toBeTruthy();
    }
  });

  it.each(slugs)('%s satisfies each block type\'s required fields', (slug) => {
    const page = INSTITUTIONAL_PAGES.find((p) => p.slug === slug);
    for (const b of page.blocks) {
      const def = getBlock(b.type);
      for (const field of def.fields.filter((f) => f.required)) {
        for (const locale of LOCALES) {
          const data = b.data[locale];
          if (!data) continue;
          expect(data[field.name], `${slug} / ${b.type} / ${locale} / ${field.name}`)
            .toBeTruthy();
        }
      }
    }
  });

  it('uses no slug that collides with a code route under app/[locale]', () => {
    // A database page whose slug matches a real directory is shadowed by the
    // code route and never renders — silently, because both are legitimate.
    const dir = path.join(ROOT, 'app', '[locale]');
    const codeRoutes = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('['))
      .map((e) => e.name);
    for (const slug of slugs) {
      expect(codeRoutes, `slug "${slug}" collides with a code route`).not.toContain(
        slug.split('/')[0],
      );
    }
  });
});

describe('translations', () => {
  it.each(slugs)('%s has a title and description in every locale', (slug) => {
    const page = INSTITUTIONAL_PAGES.find((p) => p.slug === slug);
    for (const locale of LOCALES) {
      expect(page.meta[locale], `${slug} meta.${locale}`).toBeTruthy();
      expect(page.meta[locale].title).toBeTruthy();
      expect(page.meta[locale].description).toBeTruthy();
    }
  });

  it.each(slugs)('%s translates every block into every locale', (slug) => {
    // A missing translation is not fatal — BlockRenderer falls back to English —
    // but it means a Bangla reader gets an English section with no warning, so
    // it should be a deliberate choice rather than an oversight.
    const page = INSTITUTIONAL_PAGES.find((p) => p.slug === slug);
    for (const [i, b] of page.blocks.entries()) {
      for (const locale of LOCALES) {
        expect(b.data[locale], `${slug} block ${i} (${b.type}) has no ${locale}`).toBeTruthy();
      }
    }
  });

  it.each(slugs)('%s does not leave English text in the bn or zh copy', (slug) => {
    const page = INSTITUTIONAL_PAGES.find((p) => p.slug === slug);
    // Proper nouns stay Latin by decision (client decisions §2), so the check is
    // for untranslated SENTENCES: a run of several English words in a row.
    const englishSentence = /\b(?:the|and|of|for|with|that|this|which|from)\b[^.]{0,60}\b(?:the|and|of|for|with|that|this|which|from)\b/i;
    for (const locale of ['bn', 'zh']) {
      for (const s of allStrings(page, locale)) {
        const text = s.replace(/<[^>]+>/g, ' ');
        expect(englishSentence.test(text), `${slug} / ${locale}: "${text.slice(0, 80)}"`)
          .toBe(false);
      }
    }
  });
});

describe('links', () => {
  const internal = [];
  for (const page of INSTITUTIONAL_PAGES) {
    for (const b of page.blocks) {
      for (const locale of LOCALES) {
        if (b.data[locale]) internal.push(...hrefs(b.data[locale]).map((h) => ({ page: page.slug, h })));
      }
    }
  }

  it('authors no href with a locale prefix', () => {
    // lib/blocks/href.js localises these per reader. A prefix baked in here
    // would send every Bangla reader to the English page.
    for (const { page, h } of internal) {
      expect(LOCALES.some((l) => h === l || h.startsWith(`${l}/`)), `${page}: ${h}`).toBe(false);
    }
  });

  it('links only to destinations that exist', () => {
    // Every internal href must resolve to one of: another institutional page, a
    // code route under app/[locale], or a legacy path written with a leading
    // slash. Anything else is a 404 authored into the content.
    const codeRoutes = new Set();
    const walk = (dir, prefix) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory() || e.name.startsWith('[')) continue;
        const p = `${prefix}/${e.name}`;
        codeRoutes.add(p.replace(/^\//, ''));
        walk(path.join(dir, e.name), p);
      }
    };
    walk(path.join(ROOT, 'app', '[locale]'), '');

    const known = new Set([...slugs, ...codeRoutes]);
    const unresolved = [];
    for (const { page, h } of internal) {
      if (/^([a-z][a-z0-9+.-]*:|\/\/|#|\?|\/)/i.test(h)) continue; // absolute or literal
      if (!known.has(h.replace(/^\/+|\/+$/g, ''))) unresolved.push(`${page} -> ${h}`);
    }
    expect(unresolved).toEqual([]);
  });

  it('localises a relative href correctly for each reader', () => {
    expect(localeHref('disclosures/tariff', 'bn')).toBe('/bn/disclosures/tariff');
    expect(localeHref('travel/toll', 'zh')).toBe('/zh/travel/toll');
  });
});

describe('no unconfirmed figures', () => {
  /**
   * Six of about 116 legacy claims are confirmed
   * (docs/source-data/2026-09-04-legacy-content-audit.md §1). This is the guard
   * that stops a future edit quietly adding a seventh.
   *
   * The allowed numbers are the confirmed corridor figures, plus the vehicle
   * class counts and years that appear as ordinary prose. Anything else that
   * looks like a published quantity has to be justified here first.
   */
  const ALLOWED = new Set(['48', '47.611', '18', '1']);

  /**
   * Bangla copy sets figures in Bengali numerals (৪৮, not 48), matching the
   * convention already used in lib/i18n/ui.js. JavaScript's \d matches ASCII
   * digits only, so without this the guard would silently skip every number on
   * every Bangla page — the exact half of the site where an unchecked figure is
   * least likely to be spotted by a reviewer.
   */
  const toAscii = (s) => s.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));

  it.each(slugs)('%s publishes no number that is not confirmed', (slug) => {
    const page = INSTITUTIONAL_PAGES.find((p) => p.slug === slug);
    const offenders = [];
    for (const locale of LOCALES) {
      for (const s of allStrings(page, locale)) {
        const text = toAscii(s.replace(/<[^>]+>/g, ' '));
        for (const m of text.matchAll(/\d[\d,.]*/g)) {
          const n = m[0].replace(/[.,]$/, '');
          if (!ALLOWED.has(n)) offenders.push(`${locale}: "${n}" in "${text.slice(0, 70)}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('actually sees Bengali numerals — guards the guard', () => {
    // If toAscii ever stops working, the test above passes vacuously on bn.
    expect(toAscii('৪৮ কিলোমিটার')).toBe('48 কিলোমিটার');
    const bnFigures = INSTITUTIONAL_PAGES.flatMap((p) => allStrings(p, 'bn'))
      .filter((s) => /[০-৯]/.test(s));
    expect(bnFigures.length).toBeGreaterThan(0);
  });

  it('never states a currency amount', () => {
    // Toll rates are confirmed and published on /travel/toll from the database.
    // A rate hardcoded into institutional prose is a second place for it to rot.
    for (const page of INSTITUTIONAL_PAGES) {
      for (const locale of LOCALES) {
        for (const s of allStrings(page, locale)) {
          expect(/[৳$]|BDT|Taka/i.test(s.replace(/<[^>]+>/g, ' ')), `${page.slug}/${locale}`)
            .toBe(false);
        }
      }
    }
  });

  it('names no individual', () => {
    // The old site listed five officers with titles; the audit rates that list
    // as years old, unverified, and containing a romanisation that collides
    // with an internationally known name.
    const forbidden = ['Liu Xiaobo', 'Xiao Zhiming', 'Shafiqul Islam Akand', 'Syed Aslam Ali', 'Shamim Ahmed'];
    for (const page of INSTITUTIONAL_PAGES) {
      for (const locale of LOCALES) {
        const blob = allStrings(page, locale).join(' ');
        for (const name of forbidden) expect(blob).not.toContain(name);
      }
    }
  });
});

describe('the awaiting-confirmation callouts', () => {
  it('marks every gap in all three locales, never only in English', () => {
    // A Bangla reader must see the gap as clearly as an English one. A callout
    // present in en and missing in bn reads as a confident statement to the
    // reader least able to check it.
    for (const page of INSTITUTIONAL_PAGES) {
      for (const [i, b] of page.blocks.entries()) {
        const has = (l) => allStrings({ blocks: [b], meta: {} }, l).some((s) => s.includes('db-pending'));
        const en = has('en');
        for (const locale of ['bn', 'zh']) {
          expect(has(locale), `${page.slug} block ${i}: pending in en=${en}, ${locale}=${has(locale)}`)
            .toBe(en);
        }
      }
    }
  });

  it('carries a worded tag, not colour alone', () => {
    for (const page of INSTITUTIONAL_PAGES) {
      for (const locale of LOCALES) {
        for (const s of allStrings(page, locale)) {
          if (!s.includes('db-pending')) continue;
          expect(s, `${page.slug}/${locale}`).toContain('db-pending-tag');
        }
      }
    }
  });

  it('says what is missing, not merely that something is', () => {
    // "Coming soon" is not a disclosure. Each callout has to name the thing
    // DBEDC must supply, or it is decoration.
    for (const page of INSTITUTIONAL_PAGES) {
      for (const s of allStrings(page, 'en')) {
        if (!s.includes('db-pending')) continue;
        const body = s.replace(/<[^>]+>/g, ' ');
        expect(body.length, `${page.slug} callout is too short to be useful`).toBeGreaterThan(120);
      }
    }
  });
});
