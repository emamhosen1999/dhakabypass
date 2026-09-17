import OpenDataBlock from '../../../components/blocks/OpenDataBlock.jsx';

/**
 * The public data feeds, listed. The endpoints themselves are code
 * (lib/open-data/format.js names them once); their names and descriptions
 * are editable `od*` strings, and the reuse terms are a field that renders
 * the pending notice while blank, because a licence is DBEDC's decision and
 * not one the site may make for it.
 */
export default {
  type: 'open-data',
  label: 'Open data feeds (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'terms', type: 'richtext', label: 'Reuse terms (blank = "not yet published")' },
    { name: 'note', type: 'text', label: 'Short note under the list, e.g. how often the feeds update' },
  ],
  Component: OpenDataBlock,
};
