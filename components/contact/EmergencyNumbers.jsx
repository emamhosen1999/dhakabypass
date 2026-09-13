import { t } from '../../lib/i18n/ui.js';

const tel = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

/**
 * The two emergency numbers — DBEDC's own line and the national emergency
 * service — as one row. Used by the footer on every page and by the
 * `emergency-strip` block, so the numbers are typed once, at /admin/settings
 * (Contact), and nowhere in code. Either renders only when its setting is
 * non-blank: a number nobody answers is worse than no number.
 */
export default function EmergencyNumbers({ locale, emergency, national, label }) {
  if (!emergency && !national) return null;
  return (
    <div className="db-footer-emergency-inner">
      {emergency ? (
        <>
          <span className="db-footer-emergency-label">{label || t(locale, 'emergency')}</span>
          <a className="db-footer-emergency-number" href={tel(emergency)}>{emergency}</a>
        </>
      ) : null}
      {national ? (
        <>
          <span className="db-footer-emergency-label">{t(locale, 'emergencyNational')}</span>
          <a className="db-footer-emergency-number" href={tel(national)}>{national}</a>
        </>
      ) : null}
    </div>
  );
}
