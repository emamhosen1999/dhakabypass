import PartnerRowBlock from '../../../components/blocks/PartnerRowBlock.jsx';

/**
 * The concession partners as text, not logos. We do not hold vector marks for
 * SRBG, SEL or UDC, and a stretched raster logo of another company's brand is
 * worse than a clean typographic credit.
 */
export default {
  type: 'partner-row',
  label: 'Partners',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'items', type: 'list', label: 'Partners', default: [] },
  ],
  Component: PartnerRowBlock,
};
