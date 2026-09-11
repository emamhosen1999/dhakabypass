import PullQuoteBlock from '../../../components/blocks/PullQuoteBlock.jsx';

/**
 * A quotation set apart from the prose, with who said it.
 *
 * The Chinese-contribution case study on the old site carried one, and any
 * testimonial, ministerial remark or lender's statement needs the same shape.
 * Without this block the only home for a quotation is a <blockquote> inside a
 * rich-text body, which has nowhere to put the attribution and no way to be
 * styled as a set-apart element.
 */
export default {
  type: 'pull-quote',
  label: 'Quotation',
  fields: [
    { name: 'quote', type: 'richtext', label: 'Quotation', required: true },
    { name: 'attribution', type: 'text', label: 'Who said it' },
    { name: 'role', type: 'text', label: 'Their role or organisation' },
    { name: 'sourceHref', type: 'text', label: 'Link to the source' },
  ],
  Component: PullQuoteBlock,
};
