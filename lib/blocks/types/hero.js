import HeroBlock from '../../../components/blocks/HeroBlock.jsx';

/**
 * The front door. One per page, always first.
 *
 * The image is deliberately optional: the inherited hero aerial is 686x386
 * and will be replaced, and the page must still stand up if an operator
 * clears it while waiting for a better frame.
 */
export default {
  type: 'hero',
  label: 'Hero',
  fields: [
    { name: 'image', type: 'image', label: 'Background image' },
    { name: 'eyebrow', type: 'text', label: 'Eyebrow' },
    { name: 'headline', type: 'text', label: 'Headline', required: true },
    { name: 'standfirst', type: 'text', label: 'Standfirst' },
    { name: 'primaryLabel', type: 'text', label: 'Primary button label' },
    { name: 'primaryHref', type: 'text', label: 'Primary button link' },
    { name: 'secondaryLabel', type: 'text', label: 'Secondary button label' },
    { name: 'secondaryHref', type: 'text', label: 'Secondary button link' },
  ],
  Component: HeroBlock,
};
