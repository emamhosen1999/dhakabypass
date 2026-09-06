import LogoRowBlock from '../../../components/blocks/LogoRowBlock.jsx';

/**
 * Partner and stakeholder marks — RHD, UDC, SDIG/SRBG, DBEDC.
 *
 * Distinct from partner-row, which carries the same relationships as text.
 * This one is for the places a reader expects the marks themselves; where we
 * hold no usable mark, partner-row stays the honest choice rather than a
 * stretched raster of another company's brand.
 *
 * `name` is the mark's alt text as well as its caption, so it is the one
 * field an entry cannot usefully omit — a logo with no accessible name is a
 * blank to a screen reader. It is not marked required only because the block
 * already drops an entry with no `logo`: a missing name is a translation gap
 * to fix in that row, not a reason to refuse the whole block.
 */
export default {
  type: 'logo-row',
  label: 'Partner logos',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'items', type: 'list', label: 'Marks', default: [],
      itemLabel: 'mark',
      itemFields: [
        { name: 'logo', type: 'image', label: 'Mark' },
        { name: 'name', type: 'text', label: 'Organisation (used as alt text)' },
        { name: 'role', type: 'text', label: 'Role' },
        { name: 'href', type: 'text', label: 'Link target' },
      ],
    },
  ],
  Component: LogoRowBlock,
};
