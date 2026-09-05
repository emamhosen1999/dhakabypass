/**
 * A `<script type="application/ld+json">` block.
 *
 * One component so the escaping rule lives in exactly one place: every `<` is
 * escaped, so a value that happened to contain a closing script tag could not
 * close the tag early and inject markup. Nothing rendered through this contains
 * one today; it is here so that adding a field later cannot quietly open an
 * injection.
 */
export default function StructuredData({ data }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
