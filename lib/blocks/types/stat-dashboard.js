import StatDashboardBlock from '../../../components/blocks/StatDashboardBlock.jsx';

/**
 * Published statistics — traffic volumes, incident response times, revenue.
 *
 * Deliberately not stat-row. stat-row is decorative furniture for the home
 * page ("48 KM", "4 LANES") and makes no claim about when anything was
 * measured. These figures may be quoted by a journalist, a lender or RHD, so
 * `asOf` is REQUIRED: a figure with no date is not a statistic, it is a
 * boast. `source` and `sourceHref` are the other half of that provenance,
 * and they are the reason this block exists as a separate type at all.
 *
 * `asOfLabel` — the words "As at" — is authored rather than assembled in
 * code, because Bangla is authoritative for statutory content and no phrase a
 * visitor reads may originate in a JSX file.
 *
 * `value` and `unit` are text, not numbers, for the same reason as in
 * stat-row: the figures here are '99.2%' and 'BDT 1,614 cr' as often as they
 * are integers, and Bangla numerals are not JavaScript numbers.
 */
export default {
  type: 'stat-dashboard',
  label: 'Statistics with provenance',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'stats', type: 'list', label: 'Figures', default: [],
      itemLabel: 'figure',
      itemFields: [
        { name: 'value', type: 'text', label: 'Value' },
        { name: 'unit', type: 'text', label: 'Unit' },
        { name: 'label', type: 'text', label: 'Label' },
        { name: 'note', type: 'text', label: 'Note' },
      ],
    },
    { name: 'asOfLabel', type: 'text', label: 'As-at label' },
    { name: 'asOf', type: 'text', label: 'Figures as at', required: true },
    { name: 'source', type: 'text', label: 'Source' },
    { name: 'sourceHref', type: 'text', label: 'Source link' },
  ],
  Component: StatDashboardBlock,
};
