import FacilityListBlock from '../../../components/blocks/FacilityListBlock.jsx';

/**
 * Rest areas and their amenities, read live from `interchanges` where
 * kind = 'service_area'. This is what /travel/facilities rendered; the block
 * lets that page become a block document.
 */
export default {
  type: 'facility-list',
  label: 'Rest areas (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    { name: 'emptyMessage', type: 'text', label: 'Shown when there are none yet' },
  ],
  Component: FacilityListBlock,
};
