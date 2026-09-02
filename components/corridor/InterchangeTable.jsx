// components/corridor/InterchangeTable.jsx
import { t } from '../../lib/i18n/ui';

const KIND_KEY = {
  interchange: 'kindInterchange',
  toll_plaza: 'kindTollPlaza',
  service_area: 'kindServiceArea',
  u_loop: 'kindULoop',
  pedestrian_overpass: 'kindPedestrianOverpass',
  bridge: 'kindBridge',
};
const STATUS_KEY = { open: 'statusOpen', construction: 'statusConstruction', planned: 'statusPlanned' };
// planned is a real, expected status — it must not visually collapse onto
// the same tag as construction just because both are "not yet open".
const TAG_CLASS = { open: 'open', construction: 'build', planned: 'planned' };

/**
 * The accessible equivalent of the strip, and useful in its own right — this is
 * what a driver actually reads to find their exit. Status appears as text, not
 * only as a colour.
 */
export default function InterchangeTable({ interchanges, locale, caption }) {
  if (!interchanges || interchanges.length === 0) {
    return <p className="db-empty-inline">{t(locale, 'noInterchanges')}</p>;
  }

  return (
    <div className="db-scroll-x">
      <table className="db-table">
        {caption ? <caption className="db-table-caption">{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">{t(locale, 'colLocation')}</th>
            <th scope="col">{t(locale, 'colChainage')}</th>
            <th scope="col">{t(locale, 'colType')}</th>
            <th scope="col">{t(locale, 'colConnects')}</th>
            <th scope="col">{t(locale, 'colStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {interchanges.map((i) => (
            <tr key={i.id}>
              <th scope="row">{i.name}</th>
              <td className="db-num">{i.chainage}</td>
              <td>{t(locale, KIND_KEY[i.kind] || 'kindInterchange')}</td>
              <td>{i.connectsTo || '—'}</td>
              <td>
                <span className={`db-tag db-tag-${TAG_CLASS[i.status] || 'planned'}`}>
                  {t(locale, STATUS_KEY[i.status] || 'statusPlanned')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
