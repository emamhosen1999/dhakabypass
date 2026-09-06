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
    {
      // A list of vehicle_class keys, not objects: the amounts come from
      // toll_rates (see the note above), so a row here is one identifier.
      name: 'classes',
      type: 'list',
      label: 'Vehicle classes to show',
      default: [],
      itemType: 'text',
      itemLabel: 'vehicle class',
    },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: TollPreviewBlock,
};
