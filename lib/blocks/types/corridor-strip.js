import CorridorStripBlock from '../../../components/blocks/CorridorStripBlock.jsx';

/**
 * The linear corridor strip — every segment coloured by status, every
 * interchange marked — read live from `segments` and `interchanges`.
 *
 * components/corridor/CorridorStrip.jsx already draws it; this block places
 * it. The interchange table that sits beneath it on /travel/status is its own
 * block (interchange-table), so an operator can show the strip alone on the
 * home page and the strip with the table on the status page.
 */
export default {
  type: 'corridor-strip',
  label: 'Corridor strip (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
  ],
  Component: CorridorStripBlock,
};
