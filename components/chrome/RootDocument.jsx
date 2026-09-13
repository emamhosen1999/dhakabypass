import '../../app/globals.css';

/**
 * The <html> and <body> every root layout renders (W6.5).
 *
 * There is no app/layout.jsx. The localised site (app/[locale]/layout.jsx),
 * the admin (app/admin/layout.jsx) and the last-resort catch-all
 * (app/[...unmatched]/layout.jsx) are each a root layout, so each can put the
 * page's real language on <html> in the server-rendered document. That
 * replaces an inline script that corrected `lang` after parse — a JavaScript
 * dependency for WCAG 3.1.1 that a screen reader could beat to the attribute.
 *
 * suppressHydrationWarning is required, not cosmetic: ThemeScript stamps
 * data-theme on this element before paint, and that attribute is absent from
 * the server HTML by design. It covers this element's own attributes only.
 */
export default function RootDocument({ lang = 'en', children }) {
  return (
    <html lang={lang} className="scroll-smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
