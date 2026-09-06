import MediaProseBlock from '../../../components/blocks/MediaProseBlock.jsx';

/** One photograph beside one argument. The workhorse of the home page. */
export default {
  type: 'media-prose',
  label: 'Image and text',
  fields: [
    { name: 'image', type: 'image', label: 'Image' },
    // A closed set, not free text: MediaProseBlock tests `side === 'left'`,
    // so the capitalised form an operator naturally types used to render as
    // `right` with no error anywhere. See lib/blocks/registry.js.
    {
      name: 'side', type: 'select', label: 'Image side', default: 'right',
      options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
    },
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'body', type: 'richtext', label: 'Body' },
    { name: 'caption', type: 'text', label: 'Image caption' },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: MediaProseBlock,
};
