/**
 * Structured data.
 *
 * A JSON-LD block is a machine-readable ASSERTION that search engines may quote
 * back to the public with DBEDC's name on it. The rule these tests enforce is
 * the one lib/seo/organization.js is built on: emit only what is verified, and
 * emit no key at all for anything else — an absent property means "not stated",
 * a present empty one means "stated, and empty", which is a different and worse
 * claim.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { organizationJsonLd, newsArticleJsonLd, ORG_NAME } from '../../lib/seo/organization.js';

const original = process.env.SITE_URL;
beforeEach(() => { process.env.SITE_URL = 'https://dhakabypass.com'; });
afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

describe('organizationJsonLd', () => {
  it('declares the organisation with a stable @id other nodes can reference', () => {
    const o = organizationJsonLd();
    expect(o['@type']).toBe('Organization');
    expect(o['@id']).toBe('https://dhakabypass.com/#organization');
    expect(o.name).toBe(ORG_NAME);
  });

  it('states nothing DBEDC has not supplied', () => {
    // Every one of these is a field a naive Organization snippet carries, and
    // every one is listed as outstanding in the client-decisions document. A
    // wrong phone number published by a road operator is the failure here.
    const o = organizationJsonLd();
    for (const key of ['telephone', 'email', 'address', 'contactPoint', 'sameAs', 'foundingDate']) {
      expect(o, key).not.toHaveProperty(key);
    }
  });

  it('carries a logo big enough for Google to use', () => {
    // Google's minimum for an organisation logo is 112x112.
    const o = organizationJsonLd();
    expect(o.logo.width).toBeGreaterThanOrEqual(112);
    expect(o.logo.height).toBeGreaterThanOrEqual(112);
    expect(o.logo.url).toMatch(/^https:\/\/dhakabypass\.com\//);
  });
});

describe('newsArticleJsonLd', () => {
  const article = {
    title: 'Vogra to Mirer Bazar reopens',
    excerpt: 'The section is carrying traffic again.',
    published_at: new Date('2026-03-14T00:00:00Z'),
  };

  it('describes the article and points at its own localised URL', () => {
    const o = newsArticleJsonLd(article, '/news/vogra', 'bn');
    expect(o['@type']).toBe('NewsArticle');
    expect(o.headline).toBe(article.title);
    expect(o.inLanguage).toBe('bn');
    expect(o.mainEntityOfPage['@id']).toBe('https://dhakabypass.com/bn/news/vogra');
  });

  it('references the organisation node instead of redeclaring it', () => {
    // Two declarations of the same company can disagree; a reference cannot.
    const o = newsArticleJsonLd(article, '/news/vogra', 'en');
    expect(o.publisher).toEqual({ '@id': 'https://dhakabypass.com/#organization' });
  });

  it('claims no author, because none has been established', () => {
    expect(newsArticleJsonLd(article, '/news/x', 'en')).not.toHaveProperty('author');
  });

  it('never asserts dateModified', () => {
    // datePublished and dateModified mean different things. Defaulting one to
    // the other asserts an edit that never happened, and search engines act on it.
    expect(newsArticleJsonLd(article, '/news/x', 'en')).not.toHaveProperty('dateModified');
  });

  it('omits the date rather than emitting an invalid one', () => {
    const o = newsArticleJsonLd({ ...article, published_at: null }, '/news/x', 'en');
    expect(o).not.toHaveProperty('datePublished');
  });

  it('omits description and image when the article has none', () => {
    const o = newsArticleJsonLd({ title: 'T', published_at: null }, '/news/x', 'en');
    expect(o).not.toHaveProperty('description');
    expect(o).not.toHaveProperty('image');
  });

  it('returns null for an article with no title, rather than an empty block', () => {
    expect(newsArticleJsonLd(null, '/news/x', 'en')).toBeNull();
    expect(newsArticleJsonLd({ title: '' }, '/news/x', 'en')).toBeNull();
  });
});
