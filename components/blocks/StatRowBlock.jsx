export default function StatRowBlock({ data }) {
  const stats = Array.isArray(data.stats) ? data.stats : [];
  return (
    <section className="db-block db-statrow">
      <dl className="db-statrow-grid">
        {stats.map((s, i) => (
          <div key={i} className="db-stat">
            {/* dt must precede dd for valid HTML and screen-reader order. Visual order is handled by CSS. */}
            <dt className="db-stat-label">{s.label}</dt>
            <dd className="db-stat-value">
              {s.value}
              {s.unit ? <span className="db-stat-unit">{s.unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
