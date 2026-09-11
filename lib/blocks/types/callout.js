import CalloutBlock from '../../../components/blocks/CalloutBlock.jsx';

/**
 * A notice with a tone.
 *
 * The provenance markers this site depends on — "Not yet published" over a
 * fact DBEDC has yet to supply, "Previous website information" over a claim
 * recovered from the old site — appear 129 times, and every one of them is a
 * `<p class="db-pending">` an operator typed by hand inside a rich-text body.
 * That is a convention held together by people remembering a class name. One
 * careless edit in the rich-text editor drops the class, and a legal
 * provenance marker silently becomes an ordinary paragraph.
 *
 * This makes the tone a FIELD. The operator picks it from a list; the markup
 * and the standard tag are the block's job. The tag text for `pending` and
 * `legacy` comes from ui_strings, so the wording stays consistent across every
 * page and is editable in one place, not 129.
 */
export default {
  type: 'callout',
  label: 'Notice',
  fields: [
    {
      name: 'tone', type: 'select', label: 'Kind of notice', default: 'info',
      options: [
        { value: 'pending', label: 'Not yet published — DBEDC still has to supply this' },
        { value: 'legacy', label: 'Recovered from the previous website' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Information' },
      ],
    },
    // Optional. For pending and legacy the standard tag is used when this is
    // blank, so those two never carry a hand-typed label that drifts.
    { name: 'heading', type: 'text', label: 'Label (leave blank for the standard one)' },
    { name: 'body', type: 'richtext', label: 'Notice', required: true },
  ],
  Component: CalloutBlock,
};
