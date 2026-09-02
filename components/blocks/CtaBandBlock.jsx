import Link from 'next/link';

export default function CtaBandBlock({ data }) {
  return (
    <section className="db-block db-ctaband">
      <div className="db-ctaband-text">
        <h2 className="db-ctaband-title">{data.heading}</h2>
        {data.body ? <p className="db-ctaband-body">{data.body}</p> : null}
      </div>
      <p className="db-actions">
        {data.primaryLabel && data.primaryHref ? (
          <Link href={data.primaryHref} className="db-btn db-btn-primary">{data.primaryLabel}</Link>
        ) : null}
        {data.secondaryLabel && data.secondaryHref ? (
          <Link href={data.secondaryHref} className="db-btn db-btn-ondark">{data.secondaryLabel}</Link>
        ) : null}
      </p>
    </section>
  );
}
