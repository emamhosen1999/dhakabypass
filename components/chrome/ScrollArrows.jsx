import { t } from '../../lib/i18n/ui.js';

/**
 * The arrow pair above a sideways-scrolling table, for the reader with a
 * mouse: a wheel scrolls up and down, and a desktop reader had no way to reach
 * the far columns of a toll schedule but the keyboard. Rendered on the server,
 * hidden, and revealed by ScrollRegions only when the table is actually wider
 * than its box — the buttons are never INSERTED by script, because a node
 * added beside a table that has streamed in but not yet hydrated is a
 * hydration mismatch (React error 418), which is exactly what the first
 * version of this did.
 *
 * A row of navigation links wraps instead (see .db-subnav); arrows are for
 * the one kind of content that cannot.
 */
export default function ScrollArrows({ locale }) {
  return (
    <div className="db-scroll-arrows" hidden>
      <button type="button" className="db-scroll-btn" data-dir="-1" aria-label={t(locale, 'scrollPrev')} disabled>{'←'}</button>
      <button type="button" className="db-scroll-btn" data-dir="1" aria-label={t(locale, 'scrollNext')}>{'→'}</button>
    </div>
  );
}
