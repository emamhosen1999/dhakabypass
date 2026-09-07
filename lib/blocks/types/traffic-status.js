import TrafficStatusBlock from '../../../components/blocks/TrafficStatusBlock.jsx';

/**
 * How the corridor is running right now, from `corridor_sections` and the
 * active `advisories`.
 *
 * Purely live: there is no condition field, no speed field and no advisory
 * text here. An operator changes a section's condition in
 * /admin/corridor/sections or raises an advisory in /admin/corridor/advisories,
 * and every page carrying this block changes with it. A block that owned its
 * own copy of a closure would be a closure someone forgets to clear.
 */
export default {
  type: 'traffic-status',
  label: 'Traffic status (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'caption', type: 'text', label: 'Table caption' },
    {
      // Section codes — `from_code-to_code`, e.g. `S-2` — which is how the
      // sections admin screen identifies them and what their UNIQUE key is.
      // Empty shows the whole corridor. A code that matches nothing is simply
      // absent, so a renamed section cannot empty the table.
      name: 'sections',
      type: 'list',
      label: 'Only these sections, e.g. S-2 (empty = whole corridor)',
      default: [],
      itemType: 'text',
      itemLabel: 'section code',
    },
    {
      name: 'sort', type: 'select', label: 'Order', default: 'corridor',
      options: [
        { value: 'corridor', label: 'Along the corridor, north to south' },
        { value: 'worst-first', label: 'Worst condition first' },
      ],
    },
    {
      // A select over yes/no rather than a number flag: the registry's `select`
      // type exists precisely so an enum cannot be one typo from silently
      // doing nothing (lib/blocks/registry.js).
      name: 'showLegend', type: 'select', label: 'Show the condition legend', default: 'yes',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
    // Shown only while `corridor.traffic_source` is 'sample'. Blank falls back
    // to the editable `mapSampleBody` string the corridor map already carries,
    // so the honesty notice can be reworded but never removed.
    { name: 'sourceNotice', type: 'text', label: 'Notice shown while conditions are sample data' },
    { name: 'emptyMessage', type: 'text', label: 'Message when no sections are published' },
  ],
  Component: TrafficStatusBlock,
};
