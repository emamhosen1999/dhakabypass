const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** The same markup the travel pages carried in code: db-page-head, db-h1, db-lede. */
export default function PageHeaderBlock({ data }) {
  const heading = text(data?.heading);
  if (!heading) return null;
  const eyebrow = text(data?.eyebrow);
  const lede = text(data?.lede);
  return (
    <header className="db-page-head">
      {eyebrow ? <p className="db-eyebrow">{eyebrow}</p> : null}
      <h1 className="db-h1">{heading}</h1>
      {lede ? <p className="db-lede">{lede}</p> : null}
    </header>
  );
}
