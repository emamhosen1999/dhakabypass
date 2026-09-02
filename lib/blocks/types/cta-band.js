import CtaBandBlock from '../../../components/blocks/CtaBandBlock.jsx';

/** A full-width dark band. One per page at most — it closes the argument. */
export default {
  type: 'cta-band',
  label: 'Call to action',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'body', type: 'text', label: 'Body' },
    { name: 'primaryLabel', type: 'text', label: 'Primary button label' },
    { name: 'primaryHref', type: 'text', label: 'Primary button link' },
    { name: 'secondaryLabel', type: 'text', label: 'Secondary button label' },
    { name: 'secondaryHref', type: 'text', label: 'Secondary button link' },
  ],
  Component: CtaBandBlock,
};
