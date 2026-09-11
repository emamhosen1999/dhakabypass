import GalleryGridBlock from '../../../components/blocks/GalleryGridBlock.jsx';

/**
 * The photo gallery, read live from `media` where in_gallery = 1.
 *
 * What /gallery rendered, as a block. The 60-image default that was hardcoded
 * in the page is now a field. Deliberately no lightbox: each image links to
 * the file itself and the browser's own viewer opens it - zero script, and it
 * works on every device (see findings-interactivity.md, INT-6).
 */
export default {
  type: 'gallery-grid',
  label: 'Photo gallery (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    { name: 'limit', type: 'number', label: 'How many to show', default: 60 },
    { name: 'emptyMessage', type: 'text', label: 'Shown when there are no photographs yet' },
  ],
  Component: GalleryGridBlock,
};
