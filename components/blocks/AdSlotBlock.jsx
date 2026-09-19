import { adsConfig, adsAllowedOn } from '../../lib/ads/config.js';
import { t } from '../../lib/i18n/ui.js';
import AdUnit from '../ads/AdUnit.jsx';

/** The formats offered, with the box each one reserves. */
export const AD_FORMATS = Object.freeze({
  leaderboard: { width: 728, height: 90, phone: { width: 320, height: 100 } },
  rectangle: { width: 336, height: 280, phone: { width: 300, height: 250 } },
  banner: { width: 468, height: 60, phone: { width: 320, height: 50 } },
});

/**
 * One advertisement, placed by an operator from /admin.
 *
 * FIXED SIZES ONLY. Cumulative Layout Shift on this site measures 0.002, which
 * is as good as it gets, and the usual way a site loses that is an ad that
 * arrives after the text and pushes it down. Every format reserves its box
 * before anything loads, so an unfilled slot leaves a gap rather than a jump.
 *
 * LABELLED. "Advertisement" is above every unit, in the reader's language.
 * That is Google's own requirement and it is also the honest thing to do on a
 * road operator's site, where a reader has every reason to assume that what
 * they are reading comes from DBEDC.
 *
 * It renders nothing at all when advertising is off, when the page is one of
 * the pages that carry none, or when the slot ID is missing — an empty
 * labelled box is worse than no box.
 */
export default function AdSlotBlock({ data, locale, pageSlug }) {
  const config = adsConfig(process.env);
  if (!config.enabled) return null;
  if (!adsAllowedOn(pageSlug)) return null;

  const slot = typeof data?.slot === 'string' ? data.slot.trim() : '';
  if (!/^\d{6,16}$/.test(slot)) return null;

  const format = AD_FORMATS[data?.format] ? data.format : 'rectangle';
  const size = AD_FORMATS[format];

  return (
    <aside
      className={`db-block db-ad db-ad-${format}`}
      aria-label={t(locale, 'adLabel')}
      style={{ '--ad-w': `${size.width}px`, '--ad-h': `${size.height}px`, '--ad-w-phone': `${size.phone.width}px`, '--ad-h-phone': `${size.phone.height}px` }}
    >
      <p className="db-ad-label">{t(locale, 'adLabel')}</p>
      <AdUnit client={config.client} slot={slot} testMode={config.testMode} />
    </aside>
  );
}
