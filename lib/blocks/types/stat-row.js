import StatRowBlock from '../../../components/blocks/StatRowBlock.jsx';

export default {
  type: 'stat-row',
  label: 'Statistics row',
  fields: [
    // Each entry: { value, unit, label }
    { name: 'stats', type: 'list', label: 'Statistics', required: true, default: [] },
  ],
  Component: StatRowBlock,
};
