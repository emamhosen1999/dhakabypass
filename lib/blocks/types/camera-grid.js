import CameraGridBlock from '../../../components/blocks/CameraGridBlock.jsx';

/**
 * Live CCTV along the corridor. A LIVE block: every camera — its name, place,
 * still image and stream — is a record at /admin/corridor/cameras.
 */
export default {
  type: 'camera-grid',
  label: 'Traffic cameras (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    { name: 'emptyMessage', type: 'text', label: 'Shown when no camera is switched on' },
  ],
  Component: CameraGridBlock,
};
