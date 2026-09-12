import PartnerRowBlock from '../../../components/blocks/PartnerRowBlock.jsx';

/**
 * The concession partners, with their marks where DBEDC holds one.
 *
 * This began as text only: no vector marks for SRBG, SEL or UDC were held,
 * and a stretched raster logo of another company's brand is worse than a
 * clean typographic credit. DBEDC has since supplied RHD, SDIG/SRBG, UDC
 * and its own mark as clean transparent crops (public/brand/*.webp,
 * registered in `media` by 23-partner-logos.sql), so `logo` is an optional
 * image per partner. A partner without one — SEL — keeps the typographic
 * credit; the two forms sit side by side without either looking like a
 * mistake, because the name and role are always printed.
 */
export default {
  type: 'partner-row',
  label: 'Partners',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'items',
      type: 'list',
      label: 'Partners',
      default: [],
      itemLabel: 'partner',
      itemFields: [
        { name: 'name', type: 'text', label: 'Name' },
        // Optional. Shown above the name at a fixed height; the name is
        // always printed too, so the picture is never the only carrier.
        { name: 'logo', type: 'image', label: 'Logo (optional)' },
        { name: 'role', type: 'text', label: 'Role' },
        { name: 'share', type: 'text', label: 'Shareholding' },
        // Optional: a sponsor named on a disclosure page with nowhere to go
        // is a dead end for the reader checking who is behind the concession.
        { name: 'href', type: 'text', label: 'Link target' },
      ],
    },
  ],
  Component: PartnerRowBlock,
};
