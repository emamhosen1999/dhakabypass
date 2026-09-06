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
    {
      name: 'items',
      type: 'list',
      label: 'Partners',
      default: [],
      itemLabel: 'partner',
      itemFields: [
        { name: 'name', type: 'text', label: 'Name' },
        { name: 'role', type: 'text', label: 'Role' },
        { name: 'share', type: 'text', label: 'Shareholding' },
        // Optional: a sponsor named on a disclosure page with nowhere to go
        // is a dead end for the reader checking who is behind the concession.
        { name: 'href', type: 'text', label: 'Link target' },
      ],
    },
  ],
  Component: PartnerRowBlock,
};
