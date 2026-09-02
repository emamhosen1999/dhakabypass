import CardGridBlock from '../../../components/blocks/CardGridBlock.jsx';

/** Short titled facts. Used for the highway connections. */
export default {
  type: 'card-grid',
  label: 'Card grid',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'items', type: 'list', label: 'Cards', default: [] },
  ],
  Component: CardGridBlock,
};
