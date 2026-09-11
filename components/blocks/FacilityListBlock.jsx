import { t } from '../../lib/i18n/ui.js';
import { getInterchangesCached, getIllustrativeCached } from '../../lib/corridor/cache.js';
import { localeName } from '../../lib/corridor/interchanges.js';
import { formatChainage } from '../../lib/corridor/chainage.js';
import IllustrativeNotice from '../corridor/IllustrativeNotice.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** What /travel/facilities rendered, reading the same records the same way. */
export default async function FacilityListBlock({ data, locale }) {
  let interchanges = [];
  let illustrative = true;
  try {
    [interchanges, illustrative] = await Promise.all([getInterchangesCached(), getIllustrativeCached()]);
  } catch { /* safe defaults */ }
  const areas = (interchanges || []).filter((i) => i.kind === 'service_area');

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  const empty = text(data?.emptyMessage) || t(locale, 'noFacilities');

  return (
    <section className="db-block db-facility-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {illustrative ? <IllustrativeNotice locale={locale} /> : null}
      {areas.length === 0 ? (
        <p className="db-empty-inline">{empty}</p>
      ) : (
        <ul className="db-facility-list">
          {areas.map((a) => (
            <li key={a.id} className="db-facility">
              <h3 className="db-facility-name">{localeName(a, locale)}</h3>
              <p className="db-num db-facility-ch">{formatChainage(a.chainage_m ?? a.chainageM)}</p>
              {Array.isArray(a.facilities) && a.facilities.length > 0 ? (
                <ul className="db-facility-tags">
                  {a.facilities.map((f, i) => (
                    <li key={i} className="db-tag db-tag-accent">{f}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
