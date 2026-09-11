import SitemapListBlock from '../../../components/blocks/SitemapListBlock.jsx';

/**
 * An HTML sitemap: every published page, as links, in the operator's order.
 *
 * Live-data. Nothing is authored but the heading and intro: the list is the
 * `pages` table, so a page published this morning appears here at once and a
 * page unpublished tonight leaves. An authored list of links would be the
 * thing that still points at a page somebody deleted in March.
 *
 * Grouped by section when the block asks for it: a page whose slug is
 * `travel/toll` sits under the page whose slug is `travel` (or, when there
 * is no such page, under a heading made from the first segment).
 */
export default {
  type: 'sitemap-list',
  label: 'Site map (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    {
      name: 'group', type: 'select', label: 'Layout', default: 'sections',
      options: [
        { value: 'sections', label: 'Grouped by section (travel, about, ...)' },
        { value: 'flat', label: 'One flat list' },
      ],
    },
  ],
  Component: SitemapListBlock,
};
