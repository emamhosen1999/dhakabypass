/**
 * Which rates the `toll-table` block prints, and how the gazette citation
 * beneath them is assembled.
 *
 * Pure, and separate from the component, for the reason every block helper on
 * this site is: the ordering and filtering of a statutory rate schedule is
 * testable without a database or a renderer, and a bug in it prints a wrong
 * price on a card that gets pinned up in a transport office.
 */

const str = (value) => (typeof value === 'string' ? value.trim() : '');

/** DECIMAL comes back from mysql2 as a string; compare as numbers or '90' sorts above '610'. */
const amount = (rate) => {
  const n = Number(rate && rate.amount_bdt);
  return Number.isFinite(n) ? n : 0;
};

/**
 * The order the RECORDS are in — `class_order`, then vehicle_class — is the
 * order the operator set in /admin/corridor/tolls and the order the gazette
 * schedule itself uses. It is the default here, and `listTollRates` already
 * returns rows that way, so 'class' is a no-op sort rather than a re-sort into
 * something almost-but-not-quite the same.
 */
export const TOLL_SORTS = ['class', 'amount-asc', 'amount-desc'];

/**
 * The rates one block shows.
 *
 * @param rates  rows from listTollRates() — already only the rates IN FORCE
 * @param data   the block's config: `section` (blank for all) and `sort`
 *
 * The section filter matches `toll_rates.section` case-insensitively and
 * ignoring surrounding space, because that column is free text an operator
 * types twice — once on the rate and once here — and "Vogra – Purbachal " must
 * not silently empty the table. It is NOT a substring match: a schedule that
 * quietly gained the rates of a neighbouring section because one name contains
 * another is worse than one that shows nothing.
 *
 * A filter that matches no row returns [], which the component renders as the
 * authored empty message. It never falls back to "show everything": a block
 * configured for one section must not publish another section's prices
 * because the name was mistyped.
 */
export function selectRates(rates, data = {}) {
  if (!Array.isArray(rates)) return [];
  const rows = rates.filter((r) => r && typeof r === 'object' && typeof r.vehicle_class === 'string');

  const wanted = str(data.section).toLowerCase();
  const filtered = wanted ? rows.filter((r) => str(r.section).toLowerCase() === wanted) : rows;

  const sort = TOLL_SORTS.includes(data.sort) ? data.sort : 'class';
  if (sort === 'class') return filtered;
  const out = [...filtered];
  out.sort((a, b) => (sort === 'amount-desc' ? amount(b) - amount(a) : amount(a) - amount(b)));
  return out;
}

/** True when any shown rate names a section — so the column is worth a header. */
export function hasSectionColumn(rows) {
  return Array.isArray(rows) && rows.some((r) => str(r && r.section) !== '');
}

/**
 * The gazette citation, or null when the operator has authored none.
 *
 * WHY THIS IS ON THE BLOCK AND NOT IN A RECORD. Bangladeshi expressway tolls
 * are fixed by government gazette notification (an S.R.O.), and publishing a
 * rate without its citation is a legal-accuracy problem rather than a missing
 * nicety. The citation therefore lives on the same block as the table it
 * certifies: an operator who changes which rates a page shows is editing the
 * record that carries the SRO number, so the two cannot drift into a page
 * quoting last year's notification over this year's prices.
 *
 * `href` is only reported when there is something to label it with. A bare
 * link with the SRO number as its text is a good accessible name; a link whose
 * text is the URL, or an empty one, is not, so a link with no number to name
 * it is dropped rather than rendered nameless.
 */
export function tollCitation(data = {}, rates = []) {
  // The notification is a property of the RATE RECORDS (audit 5.1), entered
  // at /admin/corridor/tolls beside the amounts it fixes. The rows shown are
  // normally one schedule under one notification; the first row carrying a
  // number names it. The block keeps only the revision-mechanism prose.
  const cited = (Array.isArray(rates) ? rates : []).find((r) => str(r?.sro_number)) || null;
  const number = str(cited?.sro_number);
  const date = str(cited?.sro_date);
  const mechanism = str(data?.revisionMechanism);
  const rawHref = str(cited?.sro_link);
  const href = number && rawHref ? rawHref : '';
  if (!number && !date && !mechanism) return null;
  return { number, date, href, mechanism };
}

/** The latest effective date among the rows shown, as a Date, or null. */
export function inForceSince(rates = []) {
  let latest = null;
  for (const r of Array.isArray(rates) ? rates : []) {
    const d = r?.effective_from instanceof Date ? r.effective_from : (r?.effective_from ? new Date(`${String(r.effective_from).slice(0, 10)}T00:00:00`) : null);
    if (d && !Number.isNaN(d.getTime()) && (!latest || d > latest)) latest = d;
  }
  return latest;
}
