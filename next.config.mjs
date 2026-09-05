/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output so the app can be built LOCALLY and run on cPanel's
  // Node.js app (Passenger) without running `next build` / `npm install` on
  // the memory-limited shared host.
  output: 'standalone',
  /**
   * Security headers.
   *
   * SCOPING MATTERS HERE. The legacy site at `app/(site)/` is LIVE and on the
   * do-not-modify list, and it embeds third-party iframes (the build log shows
   * `allowfullscreen` on them). A Content-Security-Policy strict enough to be
   * worth having would break those embeds on a site that is currently serving
   * the public — so the enforcing CSP is applied only to the localised tree and
   * the admin, both of which are ours and are tested. The legacy tree gets the
   * same policy in REPORT-ONLY form, which changes nothing about how it renders
   * while still surfacing what a future enforcing policy would block.
   *
   * The headers that cannot break a page — nosniff, referrer policy, frame
   * options, HSTS, permissions policy — are applied everywhere.
   *
   * ON `unsafe-inline` IN script-src. The correct answer is a per-request nonce,
   * and Next generates one only from middleware. `middleware.js` is on the
   * do-not-modify list, so that route is closed. `unsafe-inline` still blocks
   * script from any other ORIGIN, which is what stops an injected
   * `<script src="https://attacker/">`; combined with `object-src 'none'`,
   * `base-uri 'self'` and `frame-ancestors 'none'` this is a real policy rather
   * than a decorative one. Revisit if middleware ever becomes editable.
   */
  async headers() {
    /**
     * Next's DEV server compiles with eval — hot reload, the React refresh
     * runtime and the dev overlay all need it. A policy without 'unsafe-eval'
     * therefore makes `npm run dev` unusable: the page loads and then every
     * interactive script dies with "Refused to evaluate a string as
     * JavaScript". It cost 58 e2e failures to notice, because the production
     * BUILD needs no eval at all and the packaged artifact was perfectly fine.
     *
     * So the allowance is development-only and can never reach production: this
     * function runs under `next dev` (development) and `next build`
     * (production), and the deployed artifact is always built by the latter.
     */
    const isDev = process.env.NODE_ENV !== 'production';

    const csp = [
      "default-src 'self'",
      // 'unsafe-inline': the theme script and the analytics consent defaults
      // must run before paint. See the note above.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com`,
      // Tailwind emits a stylesheet; 'unsafe-inline' covers the style attributes
      // React sets for the corridor strip's computed offsets.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      // Analytics beacons. Everything else is refused.
      `connect-src 'self'${isDev ? ' ws: http://localhost:* http://127.0.0.1:*' : ''}`
        + ' https://www.google-analytics.com https://region1.google-analytics.com',
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // No `upgrade-insecure-requests`. The browser IGNORES it in a
      // report-only policy and logs a console error for every page load — which
      // costs a Lighthouse Best Practices point and buries real errors in the
      // noise. It also rewrites http to https on a staging or local origin,
      // breaking the RSC fetches the app makes to itself. The
      // Strict-Transport-Security header above already forces https for the
      // real domain, which is what the directive was there for.
    ].join('; ');

    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      // Two years, with preload eligibility. Only meaningful once the site is
      // actually on https everywhere — which it is, behind cPanel's AutoSSL.
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      // Nothing on this site needs any of these. Denying them means a future
      // third-party script cannot quietly start asking for them either.
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      },
    ];

    return [
      { source: '/:path*', headers: common },
      // Enforced on the trees we own and test.
      { source: '/:locale(en|bn|zh)/:path*', headers: [{ key: 'Content-Security-Policy', value: csp }] },
      { source: '/:locale(en|bn|zh)', headers: [{ key: 'Content-Security-Policy', value: csp }] },
      { source: '/admin/:path*', headers: [{ key: 'Content-Security-Policy', value: csp }] },
      // Report-only everywhere else, so the legacy site keeps working while we
      // still learn what an enforcing policy would break at cutover.
      { source: '/:path*', headers: [{ key: 'Content-Security-Policy-Report-Only', value: csp }] },
    ];
  },
  async redirects() {
    return [
      {
        source: '/about-project',
        destination: '/project/overview',
        permanent: true,
      },
      {
        source: '/expressway-route',
        destination: '/routes-facilities',
        permanent: true,
      },
      {
        source: '/virtual-tour',
        destination: '/',
        permanent: true,
      },
      {
        source: '/project/technology',
        destination: '/project/overview',
        permanent: true,
      },
      {
        source: '/about-project/',
        destination: '/project/overview',
        permanent: true,
      },
      {
        source: '/expressway-route/',
        destination: '/routes-facilities',
        permanent: true,
      },
      {
        source: '/virtual-tour/',
        destination: '/',
        permanent: true,
      },
      {
        source: '/project/technology/',
        destination: '/project/overview',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
