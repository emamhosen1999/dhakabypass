import TollTableBlock from '../../../components/blocks/TollTableBlock.jsx';

/**
 * The full toll schedule. A HYBRID: live rates, authored provenance.
 *
 * THERE IS NO AMOUNT FIELD HERE, and there must never be one. Every rate is
 * read from `toll_rates` at render time, so this block, `toll-preview` on the
 * home page and /travel/toll all quote the same figure — the records-vs-blocks
 * rule the client locked on 2026-09-06: change the fact in its record screen,
 * change how it looks in the page.
 *
 * The four SRO fields are the deliberate exception, and the reason this type
 * is hybrid rather than purely live. Tolls on this corridor are fixed by
 * government gazette notification; publishing a rate without its citation is a
 * legal-accuracy problem. The citation is not a property of any one rate row —
 * one notification fixes the whole schedule — so there is no record for it to
 * live on, and a separate "gazette citation" block placed near the table would
 * be free to drift away from it, or be deleted, or be left behind quoting last
 * year's notification. Authored on the block that renders the rates, the two
 * are one record: saved together, translated together, rendered inside one
 * <figure>.
 */
export default {
  type: 'toll-table',
  label: 'Toll schedule (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    // Not required: the component falls back to the editable `tollCaption`
    // string, so the table always has a real <caption> even on a block nobody
    // has filled this in on. Requiring it would block a save; falling back
    // guarantees the accessibility outcome the requirement is actually about.
    { name: 'caption', type: 'text', label: 'Table caption' },
    // Matched against `toll_rates.section`, ignoring case and surrounding
    // space. Blank shows every rate in force. NOT a select: the sections are
    // free text on the rate records, so a closed list here would go stale the
    // first time an operator added one.
    { name: 'section', type: 'text', label: 'Only this section (blank = all sections)' },
    {
      name: 'sort', type: 'select', label: 'Order', default: 'class',
      options: [
        // The record order — `class_order` — is the order the gazette
        // schedule itself uses, so it is the default.
        { value: 'class', label: 'Vehicle class order (as recorded)' },
        { value: 'amount-asc', label: 'Cheapest first' },
        { value: 'amount-desc', label: 'Most expensive first' },
      ],
    },
    { name: 'emptyMessage', type: 'text', label: 'Message when no rates are published' },

    // ---- Gazette provenance. Authored, and rendered WITH the table. ----
    // The number is also the link text when a link is given: an S.R.O. number
    // is a good accessible name, a bare URL is not.
    { name: 'sroNumber', type: 'text', label: 'Gazette / S.R.O. number' },
    { name: 'sroDate', type: 'text', label: 'Notification date' },
    { name: 'sroLink', type: 'text', label: 'Link to the notification' },
    { name: 'revisionMechanism', type: 'text', label: 'How the rates are revised' },
  ],
  Component: TollTableBlock,
};
