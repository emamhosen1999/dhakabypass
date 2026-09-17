import TravelTimeHistoryBlock from '../../../components/blocks/TravelTimeHistoryBlock.jsx';

/**
 * Typical speed by hour of day, per section, from the measurements kept in
 * `traffic_history` (54). Purely live: the block stores how far back to look
 * and how many measurements a cell needs before it shows a figure. Until the
 * refresh has run for long enough it says so, in the operator's own words or
 * the editable `historyNotEnough` string.
 */
export default {
  type: 'travel-time-history',
  label: 'Typical speed by hour (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'days', type: 'number', label: 'Days of measurements to use', default: 90, min: 7, max: 400 },
    { name: 'minSamples', type: 'number', label: 'Measurements a cell needs before it shows a speed', default: 3, min: 1, max: 100 },
    {
      name: 'sections',
      type: 'list',
      label: 'Only these sections, e.g. S-2 (empty = whole corridor)',
      default: [],
      itemType: 'text',
      itemLabel: 'section code',
    },
    { name: 'emptyMessage', type: 'text', label: 'Message while there are not enough measurements yet' },
  ],
  Component: TravelTimeHistoryBlock,
};
