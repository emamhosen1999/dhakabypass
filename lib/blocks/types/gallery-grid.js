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
    // Per page (INT.6). Beyond it the block renders numbered page links -
    // real links with ?page=, server-rendered, so every photograph is
    // reachable with no JavaScript and each one stays a native link to its
    // own file, the browser's viewer doing the zoom and the download.
    { name: 'limit', type: 'number', label: 'Photographs per page', default: 60, min: 1, max: 200 },
    { name: 'emptyMessage', type: 'text', label: 'Shown when there are no photographs yet' },
  ],
  Component: GalleryGridBlock,
};
