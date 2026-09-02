export default function PartnerRowBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <dl className="db-partners">
        {items.map((p, i) => (
          <div key={i} className="db-partner">
            {/* dt precedes dd: the project's dl convention, set in Task 17 of the
                foundations plan. Visual order is CSS's problem, not the DOM's. */}
            <dt className="db-partner-name">{p ? p.name : ''}</dt>
            <dd className="db-partner-role">
              {p && p.role ? p.role : ''}
              {p && p.share ? <span className="db-partner-share">{p.share}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
