import NewsListBlock from '../../../components/blocks/NewsListBlock.jsx';
import { SHOW_FILTER_FIELD } from '../filter.js';

/**
 * The newsroom listing, read live from `news_updates`.
 *
 * What /news rendered, as a block. The 24-item cap that was hardcoded in the
 * page is now a field, and the same block filtered to a category serves the
 * press-release archive the peer benchmark asked for (W5.9) - one type, not a
 * parallel content model that would drift.
 */
export default {
  type: 'news-list',
  label: 'News list (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    SHOW_FILTER_FIELD,
    { name: 'category', type: 'text', label: 'Only this category (blank for all)' },
    { name: 'limit', type: 'number', label: 'How many to show', default: 24, min: 1, max: 200 },
    { name: 'emptyMessage', type: 'text', label: 'Shown when there is nothing yet' },
  ],
  Component: NewsListBlock,
};
