import { t } from '../../lib/i18n/ui';

/**
 * Shown wherever operational figures appear while they await official
 * confirmation from DBEDC/RHD. role="note" rather than "alert": it is
 * standing context, not an interruption.
 *
 * The optional `id` exists so a table of figures can point at this notice
 * with aria-describedby — see components/blocks/TollMatrixBlock.jsx. A banner
 * beside a grid of prices is easy to scroll past; one the grid is described by
 * is announced on entering the prices. Omitted everywhere else, where the
 * notice sits inline with the figures it qualifies.
 */
export default function IllustrativeNotice({ locale, id }) {
  return (
    <aside id={id} className="db-illustrative" role="note">
      <span className="db-illustrative-tag">{t(locale, 'provisional')}</span>
      <span>{t(locale, 'provisionalBody')}</span>
    </aside>
  );
}
