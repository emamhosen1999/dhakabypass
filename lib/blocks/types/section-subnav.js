import SectionSubnavBlock from '../../../components/blocks/SectionSubnavBlock.jsx';
import { SECTION_MENU_SLUGS } from '../../menus/slugs.js';

/**
 * A section's sub-navigation, as a block.
 *
 * It was injected by app/[locale]/travel/layout.jsx, which is why the six
 * travel pages could not become block documents: the catch-all renderer is not
 * under travel/ and would not inherit that layout. As a block the operator
 * places it at the top of each travel page — and can leave it off a page that
 * does not belong to the section.
 *
 * W1.11: the links come from a menu edited at /admin/menus (the `travel`
 * menu), so an operator can add, rename or reorder them without a deploy.
 * While that menu is empty the built-in travel links render instead — the
 * override-not-replace rule the header and footer follow — so an outage or an
 * untouched menu never leaves the travel pages without their navigation.
 */
export default {
  type: 'section-subnav',
  label: 'Section menu',
  fields: [
    {
      name: 'menu', type: 'select', label: 'Which menu', default: 'travel',
      options: SECTION_MENU_SLUGS.map((slug) => ({ value: slug, label: `${slug} (edited under Navigation)` })),
    },
    { name: 'label', type: 'text', label: 'Accessible name for the menu (blank = "Travel")' },
  ],
  Component: SectionSubnavBlock,
};
