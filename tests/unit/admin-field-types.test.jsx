// tests/unit/admin-field-types.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resetRegistry, getBlock } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { parseBlockForm } from '../../lib/blocks/form.js';
import BlockFields from '../../components/admin/BlockFields.jsx';

beforeEach(() => { resetRegistry(); registerAllBlocks(); });

const render = (type, data) =>
  renderToStaticMarkup(<BlockFields fields={getBlock(type).fields} data={data} />);

/**
 * The three field shapes the registry gained in W1.22 that had no editing UI
 * at all. Each one is a way for an operator to lose work silently, so each is
 * asserted at the level of the markup the browser actually receives.
 */
describe('select fields (media-prose.side)', () => {
  const html = () => render('media-prose', { side: 'left', heading: 'H' });

  it('renders a real <select>, not a free-text input', () => {
    const out = html();
    expect(out).toMatch(/<select[^>]*name="f\.side"/);
    expect(out).not.toMatch(/<input[^>]*name="f\.side"/);
  });

  it('offers exactly the declared options, by label', () => {
    const out = html();
    expect(out).toContain('<option value="left"');
    expect(out).toContain('<option value="right"');
    expect(out).toContain('>Left<');
    expect(out).toContain('>Right<');
  });

  it('preselects the stored value', () => {
    expect(html()).toMatch(/<option value="left"[^>]*selected/);
  });

  it('preselects the declared default when nothing is stored', () => {
    const out = render('media-prose', { heading: 'H' });
    expect(out).toMatch(/<option value="right"[^>]*selected/);
  });

  it('round-trips through parseBlockForm to a value the validator accepts', () => {
    const fd = new FormData();
    fd.set('f.side', 'left');
    expect(parseBlockForm('media-prose', fd).side).toBe('left');
  });
});

describe('richtext as a list sub-field (faq.items[].answer)', () => {
  const html = () => render('faq', {
    items: [{ question: 'Who runs the road?', answer: '<p class="db-pending">DBEDC.</p>' }],
  });

  it('gives the row a rich-text surface rather than a plain box', () => {
    const out = html();
    expect(out).toContain('contenteditable="true"');
    expect(out).toContain('class="db-pending"');
  });

  it('still submits the whole list as one JSON payload under f.items', () => {
    expect(html()).toMatch(/name="f\.items"/);
  });

  it('does not give the row editor its own f.* name that would shadow the list', () => {
    expect(html()).not.toMatch(/name="f\.answer"/);
  });

  it('sanitises each row on save, through the one sanitiser', () => {
    const fd = new FormData();
    fd.set('f.items', JSON.stringify([{ question: 'Q', answer: '<p onclick="x()">A</p><script>1</script>' }]));
    const { items } = parseBlockForm('faq', fd);
    expect(items[0].answer).toBe('<p>A</p>');
  });
});

describe('a list nested inside a list row (data-table.rows[].cells)', () => {
  const data = {
    caption: 'Toll schedule',
    columns: [{ label: 'Class', numeric: 0 }, { label: 'Vogra', numeric: 1 }, { label: 'Bhulta', numeric: 1 }],
    rows: [{ cells: ['Car', '', '120'] }],
  };
  const html = () => render('data-table', data);

  it('renders one input per cell, including the blank one', () => {
    const out = html();
    expect(out).toContain('value="Car"');
    expect(out).toContain('value="120"');
    // Three cells means three inputs inside the row's cell list, blank included.
    const cells = out.match(/data-cell-input="true"/g) || [];
    expect(cells.length).toBe(3);
  });

  it('accepts the bare-array row shape the seed files write', () => {
    const out = render('data-table', { ...data, rows: [['Bus', '', '250']] });
    expect(out).toContain('value="Bus"');
    expect(out).toContain('value="250"');
  });

  it('keeps a blank cell on save so later cells stay in their column', () => {
    const fd = new FormData();
    fd.set('f.rows', JSON.stringify([{ cells: ['Car', '', '120'] }]));
    const { rows } = parseBlockForm('data-table', fd);
    expect(rows[0].cells).toEqual(['Car', '', '120']);
  });

  it('offers add, remove and keyboard reorder controls for the cells', () => {
    const out = html();
    expect(out).toMatch(/Add cell/i);
    expect(out).toMatch(/Remove cell/i);
    expect(out).toMatch(/Move cell 1 down/i);
  });
});

describe('every list row control is reachable from the keyboard', () => {
  it('reorders with real buttons, not a drag handle only', () => {
    const out = render('card-grid', { items: [{ title: 'A' }, { title: 'B' }] });
    expect(out).toMatch(/<button[^>]*type="button"[^>]*aria-label="Move card 1 down"/);
    expect(out).toMatch(/<button[^>]*type="button"[^>]*aria-label="Move card 2 up"/);
    expect(out).not.toMatch(/draggable="true"/);
  });

  it('disables the moves that would run off the ends', () => {
    const out = render('card-grid', { items: [{ title: 'A' }, { title: 'B' }] });
    expect(out).toMatch(/aria-label="Move card 1 up"[^>]*disabled|disabled[^>]*aria-label="Move card 1 up"/);
    expect(out).toMatch(/aria-label="Move card 2 down"[^>]*disabled|disabled[^>]*aria-label="Move card 2 down"/);
  });
});
