import FaqBlock from '../../../components/blocks/FaqBlock.jsx';
import { SHOW_FILTER_FIELD } from '../filter.js';

/** Questions and answers (benchmark D5). Renders as <details>/<summary>. */
export default {
  type: 'faq',
  label: 'Questions and answers',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    SHOW_FILTER_FIELD,
    {
      name: 'items', type: 'list', label: 'Questions', default: [],
      itemFields: [
        { name: 'question', type: 'text', label: 'Question' },
        { name: 'answer', type: 'richtext', label: 'Answer' },
      ],
    },
  ],
  Component: FaqBlock,
};
