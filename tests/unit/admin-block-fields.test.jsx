// tests/unit/admin-block-fields.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resetRegistry, getBlock } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import BlockFields from '../../components/admin/BlockFields.jsx';

beforeEach(() => { resetRegistry(); registerAllBlocks(); });

const render = (type, data) =>
  renderToStaticMarkup(<BlockFields fields={getBlock(type).fields} data={data} />);

/**
 * W1.1 / W1.2 / W1.3. These assert the *server-rendered* first paint of the
 * block editor's field layer — which is also the no-JavaScript fallback, so
 * every field still has to carry a submittable value under the `f.<name>`
 * key `lib/blocks/form.js` reads.
 */
describe('BlockFields — image fields (W1.1)', () => {
  const html = () => render('hero', { image: '/bg-hero.webp', headline: 'x' });

  it('renders a thumbnail of the current value', () => {
    expect(html()).toContain('src="/bg-hero.webp"');
  });

  it('submits the path under f.image without the operator typing it', () => {
    expect(html()).toMatch(/<input[^>]*type="hidden"[^>]*name="f\.image"|<input[^>]*name="f\.image"[^>]*type="hidden"/);
  });

  it('offers an upload control', () => {
    expect(html()).toContain('type="file"');
  });

  it('offers a picker for images already in the media library', () => {
    expect(html()).toMatch(/Choose from media/i);
  });

  it('no longer falls through to a bare text input', () => {
    expect(html()).not.toMatch(/<input[^>]*name="f\.image"[^>]*type="text"/);
  });
});

describe('BlockFields — list fields (W1.2)', () => {
  const data = {
    heading: 'Connections',
    items: [
      { title: 'N1', meta: 'Highway', body: 'South' },
      { title: 'N2', meta: 'Highway', body: 'North' },
    ],
  };
  const html = () => render('card-grid', data);

  it('does not render the raw JSON textarea any more', () => {
    expect(html()).not.toMatch(/\(JSON list\)/);
  });

  it('renders one editable input per declared sub-field per row', () => {
    const out = html();
    expect(out).toContain('value="N1"');
    expect(out).toContain('value="N2"');
    expect(out).toContain('value="South"');
  });

  it('still submits the whole list under f.items so the server parse is unchanged', () => {
    expect(html()).toMatch(/name="f\.items"/);
  });

  it('offers add, delete and reorder controls', () => {
    const out = html();
    expect(out).toMatch(/Add /i);
    expect(out).toMatch(/Remove|Delete/i);
    expect(out).toContain('↑');
    expect(out).toContain('↓');
  });

  it('renders an image sub-field with a thumbnail for figure-grid rows', () => {
    const out = render('figure-grid', { items: [{ image: '/photo/20.webp', caption: 'A' }] });
    expect(out).toContain('src="/photo/20.webp"');
  });

  it('renders a scalar row editor for toll-preview.classes', () => {
    const out = render('toll-preview', { classes: ['car', 'bus'] });
    expect(out).toContain('value="car"');
    expect(out).toContain('value="bus"');
    expect(out).toMatch(/name="f\.classes"/);
  });

  it('falls back to the JSON textarea for a list with no declared shape', () => {
    const fields = [{ name: 'raw', type: 'list', label: 'Raw' }];
    const out = renderToStaticMarkup(<BlockFields fields={fields} data={{ raw: [1, 2] }} />);
    expect(out).toContain('<textarea');
    expect(out).toContain('name="f.raw"');
  });
});

describe('BlockFields — rich text (W1.3)', () => {
  const body = '<p class="db-pending"><span class="db-pending-tag">Not yet published</span>Soon.</p>';
  const html = () => render('rich-text', { heading: 'H', body });

  it('renders an editable surface showing the formatted content, not tag soup', () => {
    const out = html();
    expect(out).toContain('contenteditable="true"');
    expect(out).toContain('class="db-pending"');
  });

  it('submits the HTML under f.body', () => {
    expect(html()).toMatch(/name="f\.body"/);
  });

  it('offers a toolbar with headings, bold, italic, link and both list types', () => {
    const out = html();
    for (const label of ['Heading 2', 'Heading 3', 'Bold', 'Italic', 'Link', 'Bulleted list', 'Numbered list']) {
      expect(out).toContain(label);
    }
  });

  it('keeps an HTML source escape hatch for the seeded db- classes', () => {
    expect(html()).toMatch(/Edit HTML/i);
  });
});

describe('BlockFields — unchanged field types', () => {
  it('still renders text and number inputs', () => {
    const fields = [
      { name: 'heading', type: 'text', label: 'Heading' },
      { name: 'count', type: 'number', label: 'Count' },
    ];
    const out = renderToStaticMarkup(<BlockFields fields={fields} data={{ heading: 'Hi', count: 3 }} />);
    expect(out).toMatch(/name="heading"|name="f\.heading"/);
    expect(out).toContain('type="number"');
    expect(out).toContain('value="Hi"');
  });
});
