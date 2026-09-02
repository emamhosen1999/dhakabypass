import Link from 'next/link';
import { getTollRatesCached } from '../../lib/corridor/cache';
import { formatTaka } from '../../lib/corridor/tolls';
import { pickRates } from '../../lib/blocks/tollPreview.js';
import { DEFAULT_LOCALE } from '../../lib/i18n/locales';

/**
 * Own-property read with English fallback.
 *
 * The vehicle class name is DATA, not UI chrome: each toll_rates row carries
 * its own class_labels JSON, keyed by locale. There is no vehicle_* key in
 * lib/i18n/ui.js and there must not be one — a second naming scheme would let
 * the home page disagree with /travel/toll the moment an operator adds a class.
 * This mirrors classLabel() in app/[locale]/travel/toll/page.jsx exactly.
 */
function classLabel(row, locale) {
  const labels = row.class_labels || {};
  if (Object.hasOwn(labels, locale) && labels[locale]) return labels[locale];
  if (Object.hasOwn(labels, DEFAULT_LOCALE) && labels[DEFAULT_LOCALE]) return labels[DEFAULT_LOCALE];
  return row.vehicle_class;
}

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
          <Link href={data.linkHref} className="db-btn db-btn-primary">{data.linkLabel}</Link>
        </p>
      ) : null}
    </section>
  );
}
