import MediaProseBlock from '../../../components/blocks/MediaProseBlock.jsx';

/** One photograph beside one argument. The workhorse of the home page. */
export default {
  type: 'media-prose',
  label: 'Image and text',
  fields: [
    { name: 'image', type: 'image', label: 'Image' },
    { name: 'side', type: 'text', label: 'Image side (left or right)', default: 'right' },
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'body', type: 'richtext', label: 'Body' },
    { name: 'caption', type: 'text', label: 'Image caption' },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: MediaProseBlock,
};
