import { t } from '../../lib/i18n/ui';

/**
 * Shown wherever operational figures appear while they await official
 * confirmation from DBEDC/RHD. role="note" rather than "alert": it is
 * standing context, not an interruption.
 */
export default function IllustrativeNotice({ locale }) {
  return (
    <aside className="db-illustrative" role="note">
      <span className="db-illustrative-tag">{t(locale, 'provisional')}</span>
      <span>{t(locale, 'provisionalBody')}</span>
    </aside>
  );
}
