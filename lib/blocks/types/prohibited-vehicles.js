import ProhibitedVehiclesBlock from '../../../components/blocks/ProhibitedVehiclesBlock.jsx';

/**
 * The vehicles that may not use the expressway, read live from the
 * corridor.prohibited_vehicles setting. One record, shown wherever the
 * operator places this — the toll page, the rules page, the home page — and
 * never typed twice. The hand-written list on /travel/rules was deliberately
 * NOT written for exactly this reason.
 */
export default {
  type: 'prohibited-vehicles',
  label: 'Prohibited vehicles (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
  ],
  Component: ProhibitedVehiclesBlock,
};
