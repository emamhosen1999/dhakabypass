import PanoramaBlock from '../../../components/blocks/PanoramaBlock.jsx';

/** A 360° panoramic view (W5.10) from a wide photograph in the media library. */
export default {
  type: 'panorama',
  label: '360° view',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    { name: 'image', type: 'image', label: 'Panoramic photograph (wide, ideally a full 360° stitch)', required: true },
    { name: 'caption', type: 'text', label: 'Caption — where it was taken' },
    {
      name: 'autoRotate', type: 'select', label: 'Turn slowly on its own', default: 'yes',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
  ],
  Component: PanoramaBlock,
};
