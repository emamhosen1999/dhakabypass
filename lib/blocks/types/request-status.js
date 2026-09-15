import RequestStatusBlock from '../../../components/blocks/RequestStatusBlock.jsx';

/**
 * Check the status of a request by its tracking number (W8C.7). A GET form:
 * the answer comes from the query string, so it works without script and the
 * reader can bookmark it.
 */
export default {
  type: 'request-status',
  label: 'Check a request by tracking number',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading (blank = the standard wording)' },
    { name: 'intro', type: 'text', label: 'Introduction' },
  ],
  Component: RequestStatusBlock,
};
