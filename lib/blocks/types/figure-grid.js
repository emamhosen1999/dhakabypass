import FigureGridBlock from '../../../components/blocks/FigureGridBlock.jsx';

/** A row of photographs. Used for the corridor gallery teaser. */
export default {
  type: 'figure-grid',
  label: 'Photo grid',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'items', type: 'list', label: 'Photographs', default: [] },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: FigureGridBlock,
};
