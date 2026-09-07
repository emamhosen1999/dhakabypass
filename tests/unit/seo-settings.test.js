/**
 * Site-level SEO (W1.24) — the values that were literals in app/layout.jsx and
 * lib/seo/organization.js, and the one rule they all obey:
 *
 *   A DATABASE OUTAGE MUST STILL EMIT A VALID TAG.
 *
 * These are read by the ROOT layout, which wraps the public site, the legacy
 * tree and the admin. A read that can throw there takes down every page on the
 * hostname, and a read that can return an empty string emits `<title></title>`
 * — which is worse than a stale title, because a search result with no title
 * is unclickable. So every reader here degrades to the code default, which is
 * exactly the string that was hardcoded before this table existed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn(), dbEnabled: vi.fn(() => true) }));

import { query } from '../../lib/db.js';
import {
  SEO_KEYS, SEO_DEFAULTS, getSeoSettings, robotsRulesFor, parseDisallowList, rootMetadata,
} from '../../lib/seo/settings.js';

const rows = (map) =>
  Object.entries(map).map(([setting_key, value]) => ({ setting_key, value: JSON.stringify(value) }));

beforeEach(() => vi.clearAllMocks());

describe('getSeoSettings', () => {
  it('returns the code defaults when nothing is stored', async () => {
    query.mockResolvedValue([]);
    const seo = await getSeoSettings('en');
    expect(seo.siteTitle).toBe(SEO_DEFAULTS.siteTitle);
    expect(seo.siteDescription).toBe(SEO_DEFAULTS.siteDescription);
    expect(seo.favicon).toBe('/favicon.ico');
    expect(seo.orgName).toBe(SEO_DEFAULTS.orgName);
    expect(seo.logoPath).toBe('/logo.webp');
  });

  it('returns the code defaults when the database is unreachable', async () => {
    // THE test for this task. A rejected query here used to be impossible
    // because there was no query — the strings were literals. Introducing a
    // read introduces a way to lose them, and this is the guard against it.
    query.mockRejectedValue(new Error('ECONNREFUSED'));
    const seo = await getSeoSettings('bn');
    expect(seo.siteTitle).toBe(SEO_DEFAULTS.siteTitle);
    expect(seo.siteDescription).toBe(SEO_DEFAULTS.siteDescription);
    expect(seo.favicon).toBe('/favicon.ico');
    expect(seo.robotsMode).toBe('default');
    expect(seo.orgName).toBe(SEO_DEFAULTS.orgName);
  });

  it('never returns an empty title even when the stored value is blank', async () => {
    // An operator who clears the field is asking for the default back, not for
    // an empty <title>. Contact details work the opposite way on purpose —
    // clearing a phone number must un-publish it — but there is no honest
    // "no title" state for a web page.
    query.mockResolvedValue(rows({ [SEO_KEYS.siteTitle]: { en: '   ' } }));
    expect((await getSeoSettings('en')).siteTitle).toBe(SEO_DEFAULTS.siteTitle);
  });

  it('reads the title and description per locale, falling back to English', async () => {
    query.mockResolvedValue(rows({
      [SEO_KEYS.siteTitle]: { en: 'Dhaka Bypass Expressway', bn: 'ঢাকা বাইপাস এক্সপ্রেসওয়ে' },
      [SEO_KEYS.siteDescription]: { en: 'The official site.' },
    }));
    expect((await getSeoSettings('bn')).siteTitle).toBe('ঢাকা বাইপাস এক্সপ্রেসওয়ে');
    expect((await getSeoSettings('bn')).siteDescription).toBe('The official site.');
    expect((await getSeoSettings('zh')).siteTitle).toBe('Dhaka Bypass Expressway');
  });

  it('carries the organisation identity used by the JSON-LD block', async () => {
    query.mockResolvedValue(rows({
      [SEO_KEYS.orgName]: 'Dhaka Bypass Expressway Development Company Limited',
      [SEO_KEYS.orgShortName]: 'DBEDC Ltd',
      [SEO_KEYS.logoPath]: '/uploads/dbedc-mark.webp',
    }));
    const seo = await getSeoSettings('en');
    expect(seo.orgName).toBe('Dhaka Bypass Expressway Development Company Limited');
    expect(seo.orgShortName).toBe('DBEDC Ltd');
    expect(seo.logoPath).toBe('/uploads/dbedc-mark.webp');
  });

  it('ignores an og image or favicon that is not a path or an https URL', async () => {
    // These are emitted into <link rel="icon"> and og:image. A value such as
    // `javascript:…` typed into the box must not reach the markup.
    query.mockResolvedValue(rows({
      [SEO_KEYS.favicon]: 'javascript:alert(1)',
      [SEO_KEYS.ogImage]: 'data:text/html,<script>',
    }));
    const seo = await getSeoSettings('en');
    expect(seo.favicon).toBe('/favicon.ico');
    expect(seo.ogImage).toBe('');
  });
});

describe('parseDisallowList', () => {
  it('takes one path per line and drops anything that is not a path', () => {
    expect(parseDisallowList('/admin\n /private \n\nnot-a-path\nhttps://x/y\n/drafts'))
      .toEqual(['/admin', '/private', '/drafts']);
  });

  it('degrades a missing or malformed value to an empty list', () => {
    expect(parseDisallowList(null)).toEqual([]);
    expect(parseDisallowList(undefined)).toEqual([]);
    expect(parseDisallowList(42)).toEqual([]);
  });
});

describe('robotsRulesFor', () => {
  const base = { siteOrigin: 'https://dhakabypass.com' };

  it('disallows everything on the admin host, with no sitemap line', () => {
    const r = robotsRulesFor({ ...base, isAdminHost: true, seo: SEO_DEFAULTS });
    expect(r.rules).toEqual([{ userAgent: '*', disallow: '/' }]);
    expect(r.sitemap).toBeUndefined();
  });

  it('publishes the ordinary rules and the sitemap by default', () => {
    const r = robotsRulesFor({ ...base, isAdminHost: false, seo: SEO_DEFAULTS });
    expect(r.rules[0].allow).toBe('/');
    expect(r.rules[0].disallow).toEqual(expect.arrayContaining(['/admin', '/api/']));
    expect(r.sitemap).toBe('https://dhakabypass.com/sitemap.xml');
  });

  it('adds the operator\'s extra disallow paths without losing the built-in ones', () => {
    const seo = { ...SEO_DEFAULTS, robotsDisallow: ['/drafts', '/admin'] };
    const r = robotsRulesFor({ ...base, isAdminHost: false, seo });
    expect(r.rules[0].disallow).toEqual(expect.arrayContaining(['/admin', '/api/', '/drafts']));
    // `/admin` typed by the operator must not appear twice.
    expect(r.rules[0].disallow.filter((d) => d === '/admin')).toHaveLength(1);
  });

  it('blocks the whole site, and withholds the sitemap, in block_all mode', () => {
    // The pre-launch switch. A sitemap line alongside `Disallow: /` is a
    // contradiction that crawlers resolve in the direction nobody wanted.
    const seo = { ...SEO_DEFAULTS, robotsMode: 'block_all' };
    const r = robotsRulesFor({ ...base, isAdminHost: false, seo });
    expect(r.rules).toEqual([{ userAgent: '*', disallow: '/' }]);
    expect(r.sitemap).toBeUndefined();
  });
});

describe('rootMetadata', () => {
  const origin = process.env.SITE_URL;
  beforeEach(() => { process.env.SITE_URL = 'https://dhakabypass.com'; });
  afterEach(() => {
    if (origin === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = origin;
  });

  it('emits the title, description and favicon the root layout used to hardcode', () => {
    const m = rootMetadata(SEO_DEFAULTS);
    expect(m.title).toBe(SEO_DEFAULTS.siteTitle);
    expect(m.description).toBe(SEO_DEFAULTS.siteDescription);
    expect(m.icons.icon[0].url).toBe('/favicon.ico');
    expect(m.icons.icon[0].type).toBe('image/x-icon');
  });

  it('describes an uploaded favicon by its real type, not as an .ico', () => {
    // The old literal said `type: 'image/x-icon', sizes: '16x16'` for every
    // icon. An operator uploading a 512px PNG through /admin/settings would
    // have had it announced as a 16x16 ICO.
    const m = rootMetadata({ ...SEO_DEFAULTS, favicon: '/uploads/mark.png' });
    expect(m.icons.icon[0].url).toBe('/uploads/mark.png');
    expect(m.icons.icon[0].type).toBe('image/png');
    expect(m.icons.icon[0].sizes).toBeUndefined();
  });

  it('adds the default share image as an absolute URL', () => {
    // og:image must be absolute. A root-relative one is ignored by every
    // scraper, which is how a share card ends up blank.
    const m = rootMetadata({ ...SEO_DEFAULTS, ogImage: '/uploads/share.webp' });
    expect(m.openGraph.images[0].url).toBe('https://dhakabypass.com/uploads/share.webp');
  });

  it('emits no openGraph block at all when no share image is set', () => {
    expect(rootMetadata(SEO_DEFAULTS).openGraph).toBeUndefined();
  });
});
