import CardGridBlock from '../../../components/blocks/CardGridBlock.jsx';

/** Short titled facts. Used for the highway connections. */
export default {
  type: 'card-grid',
  label: 'Card grid',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'items',
      type: 'list',
      label: 'Cards',
      default: [],
      itemLabel: 'card',
      // The shape the seeded rows already use — see db/sql/02-seed.sql.
      itemFields: [
        { name: 'title', type: 'text', label: 'Title' },
        { name: 'meta', type: 'text', label: 'Kicker' },
        { name: 'body', type: 'textarea', label: 'Body' },
        // Optional, and last so no seeded row changes shape: several W3/W4
        // pages need a photograph or mark per card, and a grid that cannot
        // carry one would force a near-duplicate block type.
        { name: 'image', type: 'image', label: 'Image' },
      ],
    },
  ],
  Component: CardGridBlock,
};
