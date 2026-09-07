import InterchangeTableBlock from '../../../components/blocks/InterchangeTableBlock.jsx';

/**
 * The interchanges, toll plazas, bridges and service areas on the corridor,
 * read live from the `interchanges` records.
 *
 * No names, chainages or statuses are authored here. Kanchan interchange
 * appears on the corridor map, the route page, the toll page and traffic
 * status; if each block owned its own copy an operator would type it four
 * times and the copies would drift within a month.
 *
 * WHY FIVE yes/no SELECTS AND NOT ONE LIST OF COLUMN NAMES. A list would be
 * free text, and an operator typing "chainge" would lose a column with no
 * error anywhere — the exact failure the `select` field type was added to
 * lib/blocks/registry.js to prevent, after `media-prose.side` spent months
 * silently ignoring "Left". Five dropdowns are more rows in the editor and
 * zero ways to get it wrong.
 *
 * Location has no toggle. It is the row's <th scope="row">, and a wayfinding
 * table whose rows carry no identifying header is a grid of bare values to a
 * screen-reader user.
 */
const columnToggle = (name, label, def) => ({
  name, type: 'select', label, default: def,
  options: [{ value: 'yes', label: 'Show' }, { value: 'no', label: 'Hide' }],
});

export default {
  type: 'interchange-table',
  label: 'Interchange table (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'caption', type: 'text', label: 'Table caption' },
    {
      name: 'sort', type: 'select', label: 'Order', default: 'chainage',
      options: [
        { value: 'chainage', label: 'By chainage, north to south' },
        { value: 'chainage-desc', label: 'By chainage, south to north' },
        { value: 'name', label: 'By name' },
      ],
    },
    // The four columns the fixed-layout /travel/status table already shows
    // default to visible, so this block is a like-for-like replacement for it.
    // Facilities is new and defaults to hidden: it is a wide column, and a
    // block that silently grew one on every existing page would be a layout
    // change nobody asked for.
    columnToggle('showChainage', 'Chainage column', 'yes'),
    columnToggle('showType', 'Type column', 'yes'),
    columnToggle('showConnects', 'Connects column', 'yes'),
    columnToggle('showStatus', 'Status column', 'yes'),
    columnToggle('showFacilities', 'Facilities column', 'no'),
    { name: 'emptyMessage', type: 'text', label: 'Message when no interchanges are published' },
  ],
  Component: InterchangeTableBlock,
};
