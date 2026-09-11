import { getSetting, CONTACT_KEYS } from '../../lib/settings.js';
import { t } from '../../lib/i18n/ui.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const tel = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

/**
 * The emergency numbers, in the page's reading order.
 *
 * Reads the same `contact_emergency` setting the footer reads, so the number
 * is typed once at /admin/settings. Nothing renders when it is empty: a
 * number nobody answers is worse than no number.
 */
export default async function EmergencyStripBlock({ data, locale }) {
  let emergency = '';
  try {
    emergency = String((await getSetting(CONTACT_KEYS.emergency, '')) || '').trim();
  } catch {
    emergency = '';
  }
  if (!emergency) return null;

  const label = text(data?.heading) || t(locale, 'emergency');
  const note = text(data?.note);

  return (
    <section className="db-block db-emergency-block" aria-label={label}>
      <div className="db-footer-emergency db-emergency-strip">
        <div className="db-footer-emergency-inner">
          <span className="db-footer-emergency-label">{label}</span>
          <a className="db-footer-emergency-number" href={tel(emergency)}>{emergency}</a>
          <span className="db-footer-emergency-label">{t(locale, 'emergencyNational')}</span>
          <a className="db-footer-emergency-number" href="tel:999">999</a>
        </div>
      </div>
      {note ? <p className="db-form-note db-emergency-note">{note}</p> : null}
    </section>
  );
}
