import PersonCardBlock from '../../../components/blocks/PersonCardBlock.jsx';

/**
 * Board of Directors and senior management (benchmark A3).
 *
 * A list rather than one block per person, deliberately: a seven-member board
 * authored as seven blocks is twenty-one translation records to keep in step,
 * and the first time somebody resigns the page loses its ordering. One block
 * holds the whole body, and reordering is a row move.
 */
export default {
  type: 'person-card',
  label: 'People',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'people', type: 'list', label: 'People', default: [],
      itemFields: [
        { name: 'photo', type: 'image', label: 'Photograph' },
        { name: 'name', type: 'text', label: 'Name' },
        { name: 'role', type: 'text', label: 'Role' },
        { name: 'affiliation', type: 'text', label: 'Affiliation' },
        { name: 'bio', type: 'richtext', label: 'Biography' },
      ],
    },
  ],
  Component: PersonCardBlock,
};
