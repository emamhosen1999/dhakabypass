/**
 * The organisation identity block, and the literal that had to go.
 *
 * `lib/seo/organization.js` used to carry
 *
 *     const LOGO = { path: '/logo.webp', width: 215, height: 204 };
 *
 * — a machine-readable ASSERTION about a file, written down by hand next to a
 * comment explaining that it had been read off the file once. Replacing the
 * logo through /admin/media changes the file and leaves 215x204 asserted in
 * structured data, wrong, with nothing to notice.
 *
 * So the dimensions are now DERIVED: from the `media` row the import already
 * probed, and failing that from the file itself. And when neither can answer,
 * the block emits the logo with NO width and height at all rather than a
 * plausible guess — which is the same rule the rest of that file follows for
 * every field DBEDC has not supplied.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('../../lib/media/repo.js', () => ({ getMediaByPath: vi.fn() }));
vi.mock('../../lib/seo/settings.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, getSeoSettings: vi.fn() };
});

import { getMediaByPath } from '../../lib/media/repo.js';
import { getSeoSettings, SEO_DEFAULTS } from '../../lib/seo/settings.js';
import { organizationJsonLd, ORG_NAME, ORG_SHORT_NAME, DEFAULT_LOGO_PATH } from '../../lib/seo/organization.js';
import { resolveLogo, localFileForPublicPath, loadOrganization } from '../../lib/seo/identity.js';

const original = process.env.SITE_URL;
beforeEach(() => {
  vi.clearAllMocks();
  process.env.SITE_URL = 'https://dhakabypass.com';
});
afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

describe('organizationJsonLd no longer asserts literal dimensions', () => {
  it('does not carry 215x204 in its source', () => {
    // The finding, tested directly. A regression that re-introduces the
    // constant would otherwise pass every behavioural test below, because the
    // real file really is 215x204 today.
    const src = fs.readFileSync(new URL('../../lib/seo/organization.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/width:\s*215/);
    expect(src).not.toMatch(/height:\s*204/);
  });

  it('omits width and height when nothing measured the file', () => {
    // schema.org accepts an ImageObject with only a url. An absent width means
    // "not stated"; a guessed one means "stated, and wrong".
    const o = organizationJsonLd();
    expect(o.logo.url).toBe('https://dhakabypass.com/logo.webp');
    expect(o.logo).not.toHaveProperty('width');
    expect(o.logo).not.toHaveProperty('height');
  });

  it('emits the dimensions it is given', () => {
    const o = organizationJsonLd({ logo: { path: '/logo.webp', width: 215, height: 204 } });
    expect(o.logo.width).toBe(215);
    expect(o.logo.height).toBe(204);
  });

  it('ignores nonsense dimensions rather than publishing them', () => {
    for (const logo of [
      { path: '/logo.webp', width: 0, height: 0 },
      { path: '/logo.webp', width: -1, height: 10 },
      { path: '/logo.webp', width: 'big', height: 'small' },
    ]) {
      const o = organizationJsonLd({ logo });
      expect(o.logo).not.toHaveProperty('width');
    }
  });

  it('takes the organisation name and short name from its caller', () => {
    const o = organizationJsonLd({ name: 'DBEDC Limited', alternateName: 'DBEDCL' });
    expect(o.name).toBe('DBEDC Limited');
    expect(o.alternateName).toBe('DBEDCL');
  });

  it('falls back to the code constants when the caller supplies nothing', () => {
    const o = organizationJsonLd();
    expect(o.name).toBe(ORG_NAME);
    expect(o.alternateName).toBe(ORG_SHORT_NAME);
    expect(DEFAULT_LOGO_PATH).toBe('/logo.webp');
  });

  it('still states nothing DBEDC has not supplied', () => {
    const o = organizationJsonLd({ name: 'x', logo: { path: '/logo.webp' } });
    for (const key of ['telephone', 'email', 'address', 'contactPoint', 'sameAs', 'foundingDate']) {
      expect(o, key).not.toHaveProperty(key);
    }
  });
});

describe('localFileForPublicPath', () => {
  it('maps a repository asset to public/', () => {
    expect(localFileForPublicPath('/logo.webp')).toBe(path.join(process.cwd(), 'public', 'logo.webp'));
  });

  it('maps an upload to the media root, which is outside the repository', () => {
    // Uploads are served by app/uploads/[...path]/route.js from MEDIA_ROOT,
    // never from public/. Probing public/uploads/x.webp would always miss.
    const got = localFileForPublicPath('/uploads/mark.webp');
    expect(got).toBe(path.join(process.cwd(), 'var', 'uploads', 'mark.webp'));
  });

  it('refuses a path that climbs out of its directory', () => {
    // The stored path comes from a database column an operator can type into.
    expect(localFileForPublicPath('/uploads/../../.env')).toBe(null);
    expect(localFileForPublicPath('../../.env')).toBe(null);
    expect(localFileForPublicPath('https://elsewhere.example/logo.png')).toBe(null);
  });
});

describe('resolveLogo', () => {
  it('uses the dimensions the media import already probed', async () => {
    getMediaByPath.mockResolvedValue({ path: '/logo.webp', width: 215, height: 204 });
    expect(await resolveLogo('/logo.webp')).toEqual({ path: '/logo.webp', width: 215, height: 204 });
  });

  it('reads the real file when the media row has no dimensions', async () => {
    // public/logo.webp is a real 215x204 WebP in this repository. This is the
    // end-to-end proof that the number is measured rather than remembered.
    getMediaByPath.mockResolvedValue({ path: '/logo.webp', width: 0, height: 0 });
    expect(await resolveLogo('/logo.webp')).toEqual({ path: '/logo.webp', width: 215, height: 204 });
  });

  it('reads the real file when the database is unreachable', async () => {
    getMediaByPath.mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await resolveLogo('/logo.webp')).toEqual({ path: '/logo.webp', width: 215, height: 204 });
  });

  it('returns the path alone when the file cannot be measured', async () => {
    // An SVG has no pixel dimensions the probe can read, and a missing file
    // must not throw out of a layout.
    getMediaByPath.mockResolvedValue(null);
    expect(await resolveLogo('/brand/nothing-here.svg')).toEqual({ path: '/brand/nothing-here.svg' });
  });
});

describe('loadOrganization', () => {
  it('feeds the settings and the derived logo into the JSON-LD block', async () => {
    getSeoSettings.mockResolvedValue({
      ...SEO_DEFAULTS, orgName: 'DBEDC Limited', orgShortName: 'DBEDCL', logoPath: '/logo.webp',
    });
    getMediaByPath.mockResolvedValue({ path: '/logo.webp', width: 215, height: 204 });

    const o = await loadOrganization();
    expect(o.name).toBe('DBEDC Limited');
    expect(o.alternateName).toBe('DBEDCL');
    expect(o.logo.width).toBe(215);
  });

  it('still emits a valid block when every read fails', async () => {
    // The block is rendered by app/[locale]/layout.jsx on every page. It must
    // degrade to the code constants, never throw.
    getSeoSettings.mockRejectedValue(new Error('ECONNREFUSED'));
    getMediaByPath.mockRejectedValue(new Error('ECONNREFUSED'));

    const o = await loadOrganization();
    expect(o['@type']).toBe('Organization');
    expect(o.name).toBe(ORG_NAME);
    expect(o.logo.url).toBe('https://dhakabypass.com/logo.webp');
  });
});
