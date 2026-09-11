import { t } from '../../lib/i18n/ui.js';

const TONES = new Set(['pending', 'legacy', 'warning', 'info']);

/**
 * Standard tags for the two provenance tones. These are the same strings the
 * hand-typed markers use today (`pendingTag`, `legacyDataTag`), so a callout
 * block and a legacy inline marker read identically on the page — and both are
 * edited at /admin/translations, once.
 */
const STANDARD_TAG = { pending: 'pendingTag', legacy: 'legacyDataTag' };

/**
 * A notice with a tone. The tone is never colour alone: each carries a text tag
 * (ICTD/WCAG 2.1 — status must survive a monochrome print and a screen reader).
 * `role="note"` marks it as parenthetical to the surrounding content rather than
 * a heading level, which is what an aside carrying provenance is.
 */
export default function CalloutBlock({ data, locale }) {
  const tone = TONES.has(data?.tone) ? data.tone : 'info';
  const body = typeof data?.body === 'string' ? data.body : '';
  if (!body.trim()) return null;

  const heading = typeof data?.heading === 'string' ? data.heading.trim() : '';
  const tag = heading || (STANDARD_TAG[tone] ? t(locale, STANDARD_TAG[tone]) : '');

  return (
    <section className="db-block db-callout-block">
      <aside className={`db-callout db-callout-${tone}`} role="note">
        {tag ? <p className="db-callout-tag">{tag}</p> : null}
        {/* Sanitised on save by lib/blocks/form.js, the single chokepoint every
            rich-text field on this site passes through. Not sanitised again
            here: a second path is a second place to get it wrong. */}
        <div className="db-callout-body db-prose" dangerouslySetInnerHTML={{ __html: body }} />
      </aside>
    </section>
  );
}
