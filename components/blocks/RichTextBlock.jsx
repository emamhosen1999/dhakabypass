export default function RichTextBlock({ data }) {
  return (
    <section className="db-block db-richtext">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {/* Body HTML comes from the admin, which is behind auth and role checks. */}
      <div className="db-prose" dangerouslySetInnerHTML={{ __html: data.body }} />
    </section>
  );
}
