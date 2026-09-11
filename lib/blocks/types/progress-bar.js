import ProgressBarBlock from '../../../components/blocks/ProgressBarBlock.jsx';

/**
 * Construction progress, read live from `segments`.
 *
 * The bar itself is components/corridor/ProgressBar.jsx, which has been welded
 * into /travel/status. Wrapping it as a block lets an operator place it on the
 * home page, the project page, or nowhere — and lets /travel/status become a
 * block document so its page file can be deleted (W1.8).
 *
 * Live-data: the operator authors a heading and an intro. The percentage, the
 * open length and the segment breakdown come from Corridor and cannot be
 * typed here — a percentage that lives in two places is the one that drifts.
 */
export default {
  type: 'progress-bar',
  label: 'Construction progress (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
  ],
  Component: ProgressBarBlock,
};
