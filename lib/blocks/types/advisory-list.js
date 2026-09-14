import AdvisoryListBlock from '../../../components/blocks/AdvisoryListBlock.jsx';

/**
 * Closures, roadworks and notices, now and ahead (W4.8, W4.11). A LIVE block:
 * every row is an advisory record from /admin/corridor/advisories, in the
 * reader's language with its window. The block stores its heading, its
 * introduction and what to print when there is nothing to report.
 */
export default {
  type: 'advisory-list',
  label: 'Advisories and closures (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    { name: 'emptyMessage', type: 'text', label: 'Shown when there are no advisories' },
  ],
  Component: AdvisoryListBlock,
};
