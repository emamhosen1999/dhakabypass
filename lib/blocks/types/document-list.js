import DocumentListBlock from '../../../components/blocks/DocumentListBlock.jsx';

/**
 * The downloads centre (benchmark D1) and the body of every disclosure page.
 *
 * File type and size are authored strings, not values read off the file. The
 * size has to be legible in Bangla and Chinese, and deriving "2.4 MB" in code
 * would put an English-only unit on a page where Bangla is authoritative. It
 * also lets an operator publish a paper that is held elsewhere — a gazette
 * PDF on a ministry site — with an honest description of what a reader gets.
 */
export default {
  type: 'document-list',
  label: 'Documents',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'documents', type: 'list', label: 'Documents', default: [],
      itemFields: [
        { name: 'title', type: 'text', label: 'Title' },
        { name: 'description', type: 'text', label: 'Description' },
        { name: 'file', type: 'text', label: 'File or link' },
        { name: 'fileType', type: 'text', label: 'File type' },
        { name: 'fileSize', type: 'text', label: 'File size' },
        { name: 'date', type: 'text', label: 'Date published' },
      ],
    },
  ],
  Component: DocumentListBlock,
};
