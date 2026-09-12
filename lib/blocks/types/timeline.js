import TimelineBlock from '../../../components/blocks/TimelineBlock.jsx';

/**
 * The project chronology — concession signed, financial close, each section
 * opened to traffic.
 *
 * `date` is the printed date and is authored per locale, so a Bangla page
 * shows a Bangla date rather than an English one formatted by code.
 * `datetime` is the machine-readable ISO value behind it, identical in all
 * three locales; it is separate precisely so a translator never has to encode
 * one. Both are optional — an entry dated only "2026" is still a milestone.
 *
 * `progress` is the milestone's completion percentage, for a corridor section
 * that is under construction. Optional: a milestone that is simply done or
 * not done leaves it unset and renders no bar at all.
 */
export default {
  type: 'timeline',
  label: 'Timeline',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'items', type: 'list', label: 'Entries', default: [],
      itemLabel: 'entry',
      itemFields: [
        { name: 'date', type: 'text', label: 'Date as printed' },
        { name: 'datetime', type: 'text', label: 'Machine-readable date (YYYY-MM-DD)' },
        { name: 'title', type: 'text', label: 'Milestone' },
        { name: 'description', type: 'richtext', label: 'Description' },
        { name: 'image', type: 'image', label: 'Photograph' },
        { name: 'progress', type: 'number', label: 'Progress (1-100; 0 or blank for no bar)' },
      ],
    },
  ],
  Component: TimelineBlock,
};
