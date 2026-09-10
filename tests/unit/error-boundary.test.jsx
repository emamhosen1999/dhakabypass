// tests/unit/error-boundary.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/navigation', () => ({ useParams: vi.fn(), usePathname: vi.fn() }));

import { useParams, usePathname } from 'next/navigation';
import { LOCALES } from '../../lib/i18n/locales.js';
import { t } from '../../lib/i18n/ui.js';
import { clearUiOverrides, applyUiOverrides } from '../../lib/i18n/overrides.js';
import LocaleError from '../../app/[locale]/error.jsx';
import GlobalError from '../../app/global-error.jsx';

/**
 * C-D7: the app had no error.jsx and no global-error.jsx, so any uncaught
 * throw in a render path showed the visitor Next's own unbranded
 * "Application error: a server-side exception has occurred (see the server
 * logs for more information)" — on a government-linked infrastructure site,
 * with no path back and no reference a caller could quote.
 *
 * Two boundaries, because they catch different things:
 *   app/[locale]/error.jsx  — a throw in a page under [locale]. The layout
 *                             above it still renders, so the header, footer
 *                             and the UiStringsBridge survive.
 *   app/global-error.jsx    — a throw in the root layout itself. It replaces
 *                             the whole document, so it renders its own
 *                             <html>/<body> and gets no chrome and no
 *                             database-backed strings — only the code values.
 */
const ERROR = Object.assign(new Error('boom'), { digest: '2748329461' });

/** Every class token in a rendered tree. */
function classTokens(html) {
  return [...html.matchAll(/class="([^"]*)"/g)]
    .flatMap((m) => m[1].split(/\s+/))
    .filter(Boolean);
}

beforeEach(() => {
  vi.clearAllMocks();
  clearUiOverrides();
});

describe('app/[locale]/error.jsx', () => {
  it.each(LOCALES)('renders the branded boundary in %s, not the raw Next message', (locale) => {
    useParams.mockReturnValue({ locale });
    const html = renderToStaticMarkup(<LocaleError error={ERROR} reset={() => {}} />);

    expect(html).toContain(t(locale, 'errorHeading'));
    expect(html).toContain(t(locale, 'errorBody'));
    expect(html).not.toContain('Application error');
    // The thrown message may name a table, a column or a connection string.
    expect(html).not.toContain('boom');
  });

  it.each(LOCALES)('offers a route back to /%s', (locale) => {
    useParams.mockReturnValue({ locale });
    const html = renderToStaticMarkup(<LocaleError error={ERROR} reset={() => {}} />);
    expect(html).toContain(`href="/${locale}"`);
    expect(html).toContain(t(locale, 'errorHome'));
  });

  it('surfaces the digest so a report can be matched to a server log line', () => {
    useParams.mockReturnValue({ locale: 'en' });
    const html = renderToStaticMarkup(<LocaleError error={ERROR} reset={() => {}} />);
    expect(html).toContain('2748329461');
    expect(html).toContain(t('en', 'errorReference'));
  });

  it('renders without a digest — a client-side throw has none', () => {
    useParams.mockReturnValue({ locale: 'en' });
    const html = renderToStaticMarkup(<LocaleError error={new Error('x')} reset={() => {}} />);
    expect(html).toContain(t('en', 'errorHeading'));
    expect(html).not.toContain(t('en', 'errorReference'));
  });

  it('offers a retry control wired to reset()', () => {
    useParams.mockReturnValue({ locale: 'en' });
    const html = renderToStaticMarkup(<LocaleError error={ERROR} reset={() => {}} />);
    expect(html).toContain(t('en', 'errorRetry'));
    expect(html).toContain('<button');
  });

  it('falls back to English when the segment is not a locale', () => {
    // `[locale]` is a dynamic segment, so /old-economic-impact arrives here
    // as locale='old-economic-impact'. UI[locale] would be undefined.
    useParams.mockReturnValue({ locale: 'old-economic-impact' });
    const html = renderToStaticMarkup(<LocaleError error={ERROR} reset={() => {}} />);
    expect(html).toContain(t('en', 'errorHeading'));
    expect(html).toContain('href="/en"');
  });

  it('renders the edited string when an operator has overridden it', () => {
    // The strings are ui_strings rows, not literals — a database outage is
    // exactly when this page is most likely to be shown, so the code value is
    // the fallback and the edited value wins when it is there.
    applyUiOverrides('en', { 'ui.errorHeading': 'We are looking into it' });
    useParams.mockReturnValue({ locale: 'en' });
    const html = renderToStaticMarkup(<LocaleError error={ERROR} reset={() => {}} />);
    expect(html).toContain('We are looking into it');
  });

  it('styles itself from the design system only — every class is a db-* class', () => {
    useParams.mockReturnValue({ locale: 'en' });
    const html = renderToStaticMarkup(<LocaleError error={ERROR} reset={() => {}} />);
    const tokens = classTokens(html);
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) expect(token, token).toMatch(/^db-/);
  });
});

describe('app/global-error.jsx', () => {
  it('renders its own html and body — it replaces the root layout', () => {
    usePathname.mockReturnValue('/en/travel/toll');
    const html = renderToStaticMarkup(<GlobalError error={ERROR} reset={() => {}} />);
    expect(html).toMatch(/^<html/);
    expect(html).toContain('<body');
    expect(html).toContain('</body></html>');
  });

  it.each(LOCALES)('takes its locale from the path and links back to /%s', (locale) => {
    usePathname.mockReturnValue(`/${locale}/news`);
    const html = renderToStaticMarkup(<GlobalError error={ERROR} reset={() => {}} />);
    expect(html).toContain(t(locale, 'errorHeading'));
    expect(html).toContain(`href="/${locale}"`);
    expect(html).toContain(`lang="${locale === 'zh' ? 'zh-Hans' : locale}"`);
  });

  it('falls back to English off a non-localised path such as /admin', () => {
    usePathname.mockReturnValue('/admin/pages-v2');
    const html = renderToStaticMarkup(<GlobalError error={ERROR} reset={() => {}} />);
    expect(html).toContain(t('en', 'errorHeading'));
    expect(html).toContain('href="/en"');
  });

  it('surfaces the digest and never the thrown message', () => {
    usePathname.mockReturnValue('/en');
    const html = renderToStaticMarkup(<GlobalError error={ERROR} reset={() => {}} />);
    expect(html).toContain('2748329461');
    expect(html).not.toContain('boom');
    expect(html).not.toContain('Application error');
  });

  it('styles itself from the design system only — every class is a db-* class', () => {
    usePathname.mockReturnValue('/en');
    const html = renderToStaticMarkup(<GlobalError error={ERROR} reset={() => {}} />);
    const tokens = classTokens(html);
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) expect(token, token).toMatch(/^db-/);
  });
});
