import TabsBlock from '../../../components/blocks/TabsBlock.jsx';

/**
 * Tabbed panels for material that is one subject seen several ways — the
 * concession by term / authority / sponsor, a toll page by vehicle class.
 *
 * Not for material a reader needs all of at once. TabsBlock keeps every panel
 * in the document (marked `hidden`, never unmounted) so a crawler and a
 * find-in-page still reach it, but a visitor sees one at a time. Long
 * statutory prose belongs in rich-text, where nobody has to guess which tab
 * it is filed under.
 */
export default {
  type: 'tabs',
  label: 'Tabbed panels',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'items', type: 'list', label: 'Panels', default: [],
      itemLabel: 'panel',
      itemFields: [
        // The tab's accessible name as well as its visible label. TabsBlock
        // drops a panel with no label rather than render an unreachable tab.
        { name: 'label', type: 'text', label: 'Tab label' },
        { name: 'body', type: 'richtext', label: 'Panel content' },
      ],
    },
  ],
  Component: TabsBlock,
};
