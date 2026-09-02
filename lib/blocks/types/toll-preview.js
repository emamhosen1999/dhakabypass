import TollPreviewBlock from '../../../components/blocks/TollPreviewBlock.jsx';

/**
 * Live rates on the front page. The amounts are never authored here — they are
 * read from toll_rates so the home page can never disagree with /travel/toll.
 */
export default {
  type: 'toll-preview',
  label: 'Toll rates preview',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'classes', type: 'list', label: 'Vehicle classes to show', default: [] },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: TollPreviewBlock,
};
