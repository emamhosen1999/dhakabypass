import FigureGridBlock from '../../../components/blocks/FigureGridBlock.jsx';

/** A row of photographs. Used for the corridor gallery teaser. */
export default {
  type: 'figure-grid',
  label: 'Photo grid',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'items',
      type: 'list',
      label: 'Photographs',
      default: [],
      itemLabel: 'photograph',
      // `image` is a path into the media table; FigureGridBlock resolves it
      // with getMediaByPath and skips the tile if no row matches, so the
      // picker must offer real media rather than a free-text path.
      itemFields: [
        { name: 'image', type: 'image', label: 'Image' },
        { name: 'caption', type: 'text', label: 'Caption' },
      ],
    },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: FigureGridBlock,
};
