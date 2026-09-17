import KmFinderBlock from '../../../components/blocks/KmFinderBlock.jsx';

/**
 * Where am I on the expressway. A GET form: the reader types the marker on
 * the nearest post, or lets the browser share a position, and the answer is
 * computed from the surveyed centreline, the interchange records and the
 * segment statuses. The emergency numbers under it are the same two
 * settings the footer reads; a blank DBEDC line renders the pending notice,
 * never a placeholder number.
 *
 * Every label falls back to an editable `locate*` string, so a block placed
 * with nothing typed still has a labelled control.
 */
export default {
  type: 'km-finder',
  label: 'Where am I (kilometre-post finder, live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'markerLabel', type: 'text', label: 'Label for the marker field (blank = "Kilometre marker on the road")' },
    { name: 'submitLabel', type: 'text', label: 'Text on the button (blank = "Find my position")' },
    { name: 'locationLabel', type: 'text', label: 'Text on the "use my location" button (blank = the standard wording)' },
    { name: 'note', type: 'text', label: 'Short note under the answer, e.g. what to tell the operator' },
    {
      name: 'showEmergency', type: 'select', label: 'Show the emergency numbers under the answer', default: 'yes',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
  ],
  Component: KmFinderBlock,
};
