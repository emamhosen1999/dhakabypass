import ConcessionScorecardBlock from '../../../components/blocks/ConcessionScorecardBlock.jsx';

/**
 * The concession as a scorecard: how far through its term it is, and the
 * obligations and indicators with a target beside the figure actually
 * achieved. Every row is editor-entered with its source and as-at date; a
 * row with no figure yet says "not yet published" in that cell rather than
 * disappearing, so a reader can see what DBEDC has committed to report.
 *
 * The two dates are text in ISO form (2018-12-06). The days elapsed and
 * remaining are computed at render time and never typed.
 */
export default {
  type: 'concession-scorecard',
  label: 'Concession scorecard',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'termLabel', type: 'text', label: 'Label for the term row (blank = "Concession term")' },
    { name: 'termStart', type: 'text', label: 'Term starts (YYYY-MM-DD; blank = the term row is not shown)' },
    { name: 'termEnd', type: 'text', label: 'Term ends (YYYY-MM-DD)' },
    { name: 'termSource', type: 'text', label: 'Source for the term dates, e.g. the concession agreement clause' },
    {
      name: 'rows', type: 'list', label: 'Indicators', default: [],
      itemLabel: 'indicator',
      itemFields: [
        { name: 'indicator', type: 'text', label: 'Indicator' },
        { name: 'target', type: 'text', label: 'Target or obligation' },
        { name: 'actual', type: 'text', label: 'Achieved (blank = not yet published)' },
        { name: 'unit', type: 'text', label: 'Unit' },
        { name: 'asOf', type: 'text', label: 'As at' },
        { name: 'source', type: 'text', label: 'Source' },
        { name: 'sourceHref', type: 'text', label: 'Source link' },
      ],
    },
    { name: 'emptyMessage', type: 'text', label: 'Message while no indicators are entered' },
  ],
  Component: ConcessionScorecardBlock,
};
