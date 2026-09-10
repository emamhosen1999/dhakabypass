/**
 * The provisional notice's MARKUP, with no i18n lookup in it.
 *
 * WHY THIS IS SPLIT OFF, AND IT IS A BUNDLE DECISION, NOT A STYLE ONE.
 * `IllustrativeNotice` calls `t()`, which imports lib/i18n/ui.js — the whole
 * fallback table, 161 keys in three languages. On the server that is free. But
 * INT.2's result panel is a CLIENT component, and importing the notice into it
 * pulled that table into the client bundle of every route that renders blocks:
 * measured at +11 kB First Load JS on `/[locale]` and `/[locale]/[...slug]`,
 * including the home page, for a warning of eleven words. Nothing else on this
 * site currently puts `t()` on the client — ConsentBanner would, but it is not
 * mounted — so the cost was entirely this component's.
 *
 * Splitting the markup out keeps ONE definition of what the notice looks like
 * (a second copy inside the calculator would drift from this one the first time
 * either was restyled) while letting the client side pass strings the server
 * already resolved. This file imports nothing at all, which is the property
 * that matters: it costs a few hundred bytes on the wire, not eleven kilobytes.
 *
 * role="note" rather than "alert": it is standing context, not an interruption.
 * `id` exists so a table or a figure can point at it with aria-describedby — a
 * banner beside a price is easy to scroll past; one the price is described by
 * is announced on reaching the price.
 */
export default function IllustrativeNoticeView({ id, tag, body }) {
  return (
    <aside id={id} className="db-illustrative" role="note">
      <span className="db-illustrative-tag">{tag}</span>
      <span>{body}</span>
    </aside>
  );
}
