// tests/unit/site-image.test.jsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SiteImage from '../../components/SiteImage.jsx';

const row = {
  path: '/bg-hero.webp', width: 686, height: 386,
  alt: { en: 'Aerial view', bn: 'আকাশ থেকে' }, focal_x: 0.5, focal_y: 0.35,
};

describe('SiteImage', () => {
  it('carries intrinsic dimensions so layout does not shift', () => {
    const html = renderToStaticMarkup(<SiteImage media={row} locale="en" />);
    expect(html).toContain('width="686"');
    expect(html).toContain('height="386"');
  });

  it('uses the locale alt text', () => {
    const html = renderToStaticMarkup(<SiteImage media={row} locale="bn" />);
    expect(html).toContain('আকাশ থেকে');
  });

  it('applies the focal point as object-position', () => {
    const html = renderToStaticMarkup(<SiteImage media={row} locale="en" />);
    expect(html).toContain('50% 35%');
  });

  it('is lazy by default and eager when priority is set', () => {
    expect(renderToStaticMarkup(<SiteImage media={row} locale="en" />)).toContain('loading="lazy"');
    const p = renderToStaticMarkup(<SiteImage media={row} locale="en" priority />);
    expect(p).toContain('loading="eager"');
    // React 19 serialises this prop as camelCase `fetchPriority`. HTML attribute
    // names are case-insensitive, so assert the behaviour rather than React's
    // choice of casing — this must not break on a React upgrade.
    expect(p.toLowerCase()).toContain('fetchpriority="high"');
  });

  it('asks the browser to preload the priority image', () => {
    // React 19 emits a <link rel="preload"> for any image that is NOT lazy --
    // loading="eager", decoding="sync" and fetchPriority="high" each trigger it
    // independently (verified by mutation). So this guards the `priority` flag
    // as a whole, not fetchPriority in particular: the assertion above does that
    // job. The preload is the actual performance win on a hero, and losing it
    // silently would cost exactly what the flag exists to buy.
    const p = renderToStaticMarkup(<SiteImage media={row} locale="en" priority />);
    expect(p).toContain('rel="preload"');
    expect(p).toContain('as="image"');
    expect(renderToStaticMarkup(<SiteImage media={row} locale="en" />)).not.toContain('rel="preload"');
  });

  it('renders nothing when there is no media row', () => {
    expect(renderToStaticMarkup(<SiteImage media={null} locale="en" />)).toBe('');
  });

  it('marks a decorative image as empty alt rather than omitting the attribute', () => {
    const html = renderToStaticMarkup(<SiteImage media={{ ...row, alt: {} }} locale="en" />);
    expect(html).toContain('alt=""');
  });
});
