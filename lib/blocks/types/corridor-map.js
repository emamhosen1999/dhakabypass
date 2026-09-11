import CorridorMapBlock from '../../../components/blocks/CorridorMapBlock.jsx';

/**
 * The interactive corridor map — pan, zoom, select a section — read live from
 * corridor_geometry, corridor_waypoints, corridor_sections and interchanges.
 *
 * Lifted out of app/[locale]/travel/map/page.jsx so it can be placed anywhere
 * and so that page can become a block document. The operator configures a
 * heading, an intro and whether the legend shows. The two honesty notices —
 * "Sample data" and "Schematic" — are driven by the data and have no field:
 * a coloured road drawn from sample conditions and shown without the label is
 * a claim about traffic nobody measured.
 */
export default {
  type: 'corridor-map',
  label: 'Corridor map (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    {
      name: 'showLegend', type: 'select', label: 'Show the legend', default: 'yes',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
  ],
  Component: CorridorMapBlock,
};
