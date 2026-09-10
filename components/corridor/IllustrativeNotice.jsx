import { t } from '../../lib/i18n/ui';
import IllustrativeNoticeView from './IllustrativeNoticeView.jsx';

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
 *
 * THE MARKUP LIVES IN ./IllustrativeNoticeView.jsx, which imports nothing.
 * This file is the server-side half: it resolves the two strings through `t()`
 * and hands them over. INT.2's toll calculator renders the view directly from
 * a client component, with strings its server half already resolved — because
 * importing THIS file there would pull the whole trilingual UI table into the
 * client bundle (+11 kB First Load, measured), and because `t()` reads the
 * operator's overrides from a store populated on the server, so calling it
 * during hydration would swap edited wording for the code fallback in front of
 * the reader.
 */
export default function IllustrativeNotice({ locale, id }) {
  return (
    <IllustrativeNoticeView
      id={id}
      tag={t(locale, 'provisional')}
      body={t(locale, 'provisionalBody')}
    />
  );
}
