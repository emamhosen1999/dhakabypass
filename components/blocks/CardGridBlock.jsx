export default function CardGridBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-cardgrid">
        {items.map((c, i) => (
          <li key={i} className="db-card">
            {c && c.meta ? <p className="db-card-meta">{c.meta}</p> : null}
            <h3 className="db-card-title">{c ? c.title : ''}</h3>
            {c && c.body ? <p className="db-card-body">{c.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
