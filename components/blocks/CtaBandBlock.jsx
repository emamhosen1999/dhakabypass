import Link from 'next/link';
import { localeHref } from '../../lib/blocks/href.js';

export default function CtaBandBlock({ data, locale }) {
  return (
    <section className="db-block db-ctaband">
      <div className="db-ctaband-text">
        <h2 className="db-ctaband-title">{data.heading}</h2>
        {data.body ? <p className="db-ctaband-body">{data.body}</p> : null}
      </div>
      <p className="db-actions">
        {data.primaryLabel && data.primaryHref ? (
          <Link href={localeHref(data.primaryHref, locale)} className="db-btn db-btn-primary">{data.primaryLabel}</Link>
        ) : null}
        {data.secondaryLabel && data.secondaryHref ? (
          <Link href={localeHref(data.secondaryHref, locale)} className="db-btn db-btn-ondark">{data.secondaryLabel}</Link>
        ) : null}
      </p>
    </section>
  );
}
