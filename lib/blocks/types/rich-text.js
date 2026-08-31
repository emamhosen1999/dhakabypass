import RichTextBlock from '../../../components/blocks/RichTextBlock.jsx';

export default {
  type: 'rich-text',
  label: 'Rich text',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'body', type: 'richtext', label: 'Body', required: true },
  ],
  Component: RichTextBlock,
};
