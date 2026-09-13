import StatRowBlock from '../../../components/blocks/StatRowBlock.jsx';
import { LIVE_SOURCES } from '../liveStats.js';

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
        // A figure that is a record (length, open length, class count) is
        // read from that record, never retyped (audit 5.9).
        { name: 'source', type: 'select', label: 'Value comes from', options: LIVE_SOURCES },
        { name: 'value', type: 'text', label: 'Value (typed values only)' },
        { name: 'unit', type: 'text', label: 'Unit' },
        { name: 'label', type: 'text', label: 'Label' },
      ],
    },
  ],
  Component: StatRowBlock,
};
