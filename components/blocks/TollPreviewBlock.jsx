import Link from 'next/link';
import { localeHref } from '../../lib/blocks/href.js';
import { getTollRatesCached } from '../../lib/corridor/cache';
import { formatTaka, classLabel } from '../../lib/corridor/tolls';
import { pickRates } from '../../lib/blocks/tollPreview.js';

// classLabel is shared with app/[locale]/travel/toll/page.jsx on purpose. The
// vehicle name is per-row data, not a UI string, and two copies of its fallback
// chain would eventually show a different name for the same rate on two pages.
export default async function TollPreviewBlock({ data, locale }) {
  let rates = [];
  try { rates = await getTollRatesCached(); } catch { rates = []; }
  const shown = pickRates(rates, data.classes);
  if (shown.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <dl className="db-tollpreview">
        {shown.map((r) => (
          <div key={r.vehicle_class} className="db-tollpreview-item">
            <dt className="db-tollpreview-class">{classLabel(r, locale)}</dt>
            <dd className="db-tollpreview-amount">{formatTaka(r.amount_bdt)}</dd>
          </div>
        ))}
      </dl>
      {data.linkLabel && data.linkHref ? (
        <p className="db-actions">
          <Link href={localeHref(data.linkHref, locale)} className="db-btn db-btn-primary">{data.linkLabel}</Link>
        </p>
      ) : null}
    </section>
  );
}
