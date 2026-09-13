import SiteSearchBlock from '../../../components/blocks/SiteSearchBlock.jsx';

/**
 * Site search (W5.14). A GET form over every published page and news article
 * in the reader's language; results are server-rendered from `?q=`, so it
 * works with no JavaScript. The wording of the form and of "no results" are
 * ui strings; the block stores only its heading, introduction and a limit.
 */
export default {
  type: 'site-search',
  label: 'Site search',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    { name: 'limit', type: 'number', label: 'Most results to show', default: 30, min: 1, max: 100 },
  ],
  Component: SiteSearchBlock,
};
