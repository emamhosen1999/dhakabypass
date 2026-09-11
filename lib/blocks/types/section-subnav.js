import SectionSubnavBlock from '../../../components/blocks/SectionSubnavBlock.jsx';

/**
 * The travel section's sub-navigation, as a block.
 *
 * It was injected by app/[locale]/travel/layout.jsx, which is why the six
 * travel pages could not become block documents: the catch-all renderer is not
 * under travel/ and would not inherit that layout. As a block the operator
 * places it at the top of each travel page — and can leave it off a page that
 * does not belong to the section.
 *
 * The links themselves come from components/chrome/TravelSubnav.jsx, which
 * still carries them in code. Making them menu-driven is W1.11; this block
 * removes the layout dependency, not the link list.
 */
export default {
  type: 'section-subnav',
  label: 'Travel section menu',
  fields: [],
  Component: SectionSubnavBlock,
};
