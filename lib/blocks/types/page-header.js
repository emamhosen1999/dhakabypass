import PageHeaderBlock from '../../../components/blocks/PageHeaderBlock.jsx';

/**
 * A page's title and lede, without a hero image.
 *
 * Every page needs exactly one <h1>. The block pages built so far open with a
 * `hero`, which carries one — but a hero is a full-bleed image with a
 * headline over it, and the travel pages, the legal pages and most of the
 * governance pages want the quieter shape they had: an eyebrow, a heading and
 * a lede at the top of the page. That shape lived in each page file as
 * `db-page-head`; this is it as a block.
 */
export default {
  type: 'page-header',
  label: 'Page title',
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small line above the title' },
    { name: 'heading', type: 'text', label: 'Page title', required: true },
    { name: 'lede', type: 'text', label: 'Introduction' },
  ],
  Component: PageHeaderBlock,
};
