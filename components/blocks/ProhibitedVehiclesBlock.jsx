import { t } from '../../lib/i18n/ui.js';
import { getProhibitedVehicles } from '../../lib/settings.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** One record, shown wherever it is placed. Renders nothing if the list is empty. */
export default async function ProhibitedVehiclesBlock({ data, locale }) {
  let prohibited = [];
  try {
    prohibited = await getProhibitedVehicles(locale);
  } catch { prohibited = []; }
  if (!Array.isArray(prohibited) || prohibited.length === 0) return null;

  const heading = text(data?.heading) || t(locale, 'prohibitedVehicles');
  const intro = text(data?.intro) || t(locale, 'prohibitedNote');

  return (
    <section className="db-block">
      <div className="db-prohibited">
        <h2 className="db-h2">{heading}</h2>
        <p className="db-lede">{intro}</p>
        <ul className="db-prohibited-list">
          {prohibited.map((vehicle) => (
            <li key={vehicle}><span className="db-tag db-tag-alert">{vehicle}</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
