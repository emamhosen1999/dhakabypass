import StatRowBlock from '../../../components/blocks/StatRowBlock.jsx';

export default {
  type: 'stat-row',
  label: 'Statistics row',
  fields: [
    {
      name: 'stats',
      type: 'list',
      label: 'Statistics',
      required: true,
      default: [],
      itemLabel: 'statistic',
      // value and unit are text, not number: the figures on this site are
      // '৳1,614cr', '75%' and '1st' as often as they are plain integers.
      itemFields: [
        { name: 'value', type: 'text', label: 'Value' },
        { name: 'unit', type: 'text', label: 'Unit' },
        { name: 'label', type: 'text', label: 'Label' },
      ],
    },
  ],
  Component: StatRowBlock,
};
