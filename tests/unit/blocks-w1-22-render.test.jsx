// tests/unit/blocks-w1-22-render.test.jsx
//
// What these blocks actually put on the page. The accessibility assertions are
// the point: Bangladesh's ICTD Inclusive Accessibility Guideline 2022 is
// WCAG 2.1-aligned, so a table without headers or an accordion that hides its
// answer from a crawler is a defect, not a preference.
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../lib/media/repo.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getMediaByPath: async (path) => (path === '/media/chair.webp'
      ? { path, width: 400, height: 400, alt: { en: 'Portrait' }, focal_x: 0.5, focal_y: 0.4 }
      : null),
  };
});

const { default: FaqBlock } = await import('../../components/blocks/FaqBlock.jsx');
const { default: DataTableBlock } = await import('../../components/blocks/DataTableBlock.jsx');
const { default: DocumentListBlock } = await import('../../components/blocks/DocumentListBlock.jsx');
const { default: ContactDirectoryBlock } = await import('../../components/blocks/ContactDirectoryBlock.jsx');
const { default: MapPinListBlock } = await import('../../components/blocks/MapPinListBlock.jsx');
const { default: StatDashboardBlock } = await import('../../components/blocks/StatDashboardBlock.jsx');
const { default: LogoRowBlock } = await import('../../components/blocks/LogoRowBlock.jsx');
const { default: TabsBlock } = await import('../../components/blocks/TabsBlock.jsx');
const { default: PersonCardBlock } = await import('../../components/blocks/PersonCardBlock.jsx');
const { default: TimelineBlock } = await import('../../components/blocks/TimelineBlock.jsx');

const render = (el) => renderToStaticMarkup(el);

describe('FaqBlock', () => {
  const data = {
    heading: 'Common questions',
    intro: 'What drivers ask most.',
    items: [
      { question: 'How is the toll set?', answer: '<p>By gazette notification.</p>' },
      { question: 'Where can I pay?', answer: '<p>At every plaza.</p>' },
    ],
  };

  it('uses details/summary, which is keyboard-operable with no script at all', () => {
    const html = render(<FaqBlock data={data} locale="en" />);
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
  });

  it('keeps every answer in the markup so a crawler and a find-in-page can see it', () => {
    const html = render(<FaqBlock data={data} locale="en" />);
    expect(html).toContain('By gazette notification.');
    expect(html).toContain('At every plaza.');
  });

  it('renders nothing when there are no questions', () => {
    expect(render(<FaqBlock data={{ heading: 'x', items: [] }} locale="en" />)).toBe('');
    expect(render(<FaqBlock data={{ heading: 'x', items: 'nope' }} locale="en" />)).toBe('');
  });
});

describe('DataTableBlock', () => {
  const data = {
    caption: 'Toll rates in force',
    note: 'SRO 214-Law/2022',
    rowHeaderColumn: 0,
    columns: [{ label: 'Vehicle class' }, { label: 'Amount (BDT)', numeric: true }],
    rows: [['Car', '150'], ['Large bus', '310']],
  };

  it('scrolls inside its own container rather than pushing the page sideways', () => {
    expect(render(<DataTableBlock data={data} locale="en" />)).toContain('db-scroll-x');
  });

  it('carries a caption and column headers', () => {
    const html = render(<DataTableBlock data={data} locale="en" />);
    expect(html).toContain('<caption');
    expect(html).toContain('Toll rates in force');
    expect(html).toContain('scope="col"');
  });

  it('makes the nominated column a row header', () => {
    const html = render(<DataTableBlock data={data} locale="en" />);
    expect(html).toContain('scope="row"');
    expect(html).toContain('>Car</th>');
  });

  it('renders the provenance note', () => {
    expect(render(<DataTableBlock data={data} locale="en" />)).toContain('SRO 214-Law/2022');
  });

  it('renders nothing when there are no column headers to read', () => {
    expect(render(<DataTableBlock data={{ caption: 'x', columns: [], rows: [['1']] }} locale="en" />)).toBe('');
  });
});

describe('DocumentListBlock', () => {
  const data = {
    heading: 'Downloads',
    documents: [{
      title: 'Toll rate card', description: 'Printable card for transport offices.',
      file: '/uploads/toll-card.pdf', fileType: 'PDF', fileSize: '240 KB', date: '6 September 2026',
    }],
  };

  it('links the file and names its format and size inside the link', () => {
    const html = render(<DocumentListBlock data={data} locale="en" />);
    expect(html).toContain('href="/uploads/toll-card.pdf"');
    const link = html.slice(html.indexOf('<a '), html.indexOf('</a>'));
    expect(link).toContain('Toll rate card');
    expect(link).toContain('PDF');
    expect(link).toContain('240 KB');
  });

  it('shows the description and date outside the link', () => {
    const html = render(<DocumentListBlock data={data} locale="en" />);
    expect(html).toContain('Printable card for transport offices.');
    expect(html).toContain('6 September 2026');
  });

  it('lists a document with no file as plain text rather than a dead link', () => {
    const html = render(<DocumentListBlock data={{ documents: [{ title: 'Annual report', file: '' }] }} locale="en" />);
    expect(html).toContain('Annual report');
    expect(html).not.toContain('<a ');
  });
});

describe('ContactDirectoryBlock', () => {
  it('publishes a department and role with no named individual', () => {
    const html = render(<ContactDirectoryBlock data={{
      items: [{ department: 'Tolling', role: 'Duty Manager', phone: '+8801700000000', email: 'tolling@dbedc.com.bd' }],
    }} locale="en" />);
    expect(html).toContain('Tolling');
    expect(html).toContain('Duty Manager');
    expect(html).toContain('href="tel:+8801700000000"');
    expect(html).toContain('href="mailto:tolling@dbedc.com.bd"');
  });

  it('renders the person only when one is named', () => {
    const withName = render(<ContactDirectoryBlock data={{
      items: [{ department: 'Media', role: 'Spokesperson', name: 'S. Islam' }],
    }} locale="en" />);
    expect(withName).toContain('S. Islam');
    const without = render(<ContactDirectoryBlock data={{
      items: [{ department: 'Media', role: 'Spokesperson' }],
    }} locale="en" />);
    expect(without).toContain('Spokesperson');
    expect(without).not.toContain('db-directory-name');
  });

  it('strips spaces out of the tel: target but not out of the printed number', () => {
    const html = render(<ContactDirectoryBlock data={{
      items: [{ department: 'Control room', phone: '+880 1700 000 000' }],
    }} locale="en" />);
    expect(html).toContain('href="tel:+8801700000000"');
    expect(html).toContain('+880 1700 000 000');
  });
});

describe('MapPinListBlock', () => {
  it('prints coordinates for a pin that has them', () => {
    const html = render(<MapPinListBlock data={{
      items: [{ name: 'Bhulta toll plaza', type: 'Toll plaza', address: 'Rupganj', lat: 23.8, lng: 90.5, notes: 'Southbound' }],
    }} locale="en" />);
    expect(html).toContain('Bhulta toll plaza');
    expect(html).toContain('23.8, 90.5');
    expect(html).toContain('Southbound');
  });

  it('still lists a pin whose coordinates were never supplied', () => {
    const html = render(<MapPinListBlock data={{ items: [{ name: 'Head office', address: 'Dhaka' }] }} locale="en" />);
    expect(html).toContain('Head office');
    expect(html).toContain('Dhaka');
  });

  it('lists the amenities of a rest area as tags, and its hours', () => {
    // What the rest-area directory is filtered on. Tags, not prose, so the
    // filter has something to match; every label is authored per locale.
    const html = render(<MapPinListBlock data={{
      items: [{
        name: 'Bhulta rest area', type: 'Rest area', hours: 'Open 24 hours',
        amenities: ['Fuel', 'Prayer room', 'Toilets'],
      }],
    }} locale="en" />);
    expect(html).toContain('Open 24 hours');
    expect(html).toContain('Fuel');
    expect(html).toContain('Prayer room');
    expect(html).toContain('Toilets');
    expect(html.match(/db-tag/g)).toHaveLength(3);
  });

  it('renders no amenity list at all for a pin with none', () => {
    const html = render(<MapPinListBlock data={{ items: [{ name: 'Head office', amenities: [] }] }} locale="en" />);
    expect(html).not.toContain('db-pin-amenities');
  });

  it('ignores an amenities value that is not a list', () => {
    const html = render(<MapPinListBlock data={{ items: [{ name: 'Head office', amenities: 'fuel' }] }} locale="en" />);
    expect(html).toContain('Head office');
    expect(html).not.toContain('db-pin-amenities');
  });
});

describe('StatDashboardBlock', () => {
  const data = {
    heading: 'Traffic and revenue', asOfLabel: 'As at', asOf: 'August 2026',
    source: 'DBEDC toll collection system', sourceHref: '/uploads/aug-2026.pdf',
    stats: [{ value: '18,400', unit: 'vehicles/day', label: 'Average daily traffic', note: 'All classes' }],
  };

  it('always shows the as-at date and the source', () => {
    const html = render(<StatDashboardBlock data={data} locale="en" />);
    expect(html).toContain('As at');
    expect(html).toContain('August 2026');
    expect(html).toContain('DBEDC toll collection system');
    expect(html).toContain('href="/uploads/aug-2026.pdf"');
  });

  it('renders each figure with its label and unit', () => {
    const html = render(<StatDashboardBlock data={data} locale="en" />);
    expect(html).toContain('18,400');
    expect(html).toContain('vehicles/day');
    expect(html).toContain('Average daily traffic');
  });

  it('renders nothing without figures, so an empty dashboard never claims provenance', () => {
    expect(render(<StatDashboardBlock data={{ asOf: 'August 2026', stats: [] }} locale="en" />)).toBe('');
  });
});

describe('LogoRowBlock', () => {
  const data = {
    heading: 'Concession partners',
    items: [
      { logo: '/brand/rhd.webp', name: 'Roads and Highways Department', role: 'Contracting authority', href: '' },
      { logo: '/brand/sdig-srbg.webp', name: 'SDIG / SRBG', role: 'Lead sponsor', href: 'https://example.org' },
    ],
  };

  it('uses the authored partner name as the alt text', () => {
    const html = render(<LogoRowBlock data={data} locale="en" />);
    expect(html).toContain('alt="Roads and Highways Department"');
  });

  it('seats every mark on the light plate, never on the themed surface', () => {
    // UI-8: the SDIG/SRBG raster carries a hard white panel and DBEDC blue
    // measures 3.06:1 on the dark plate. The tile is a fixed light ground in
    // both themes, so the marks never sit on the dark surface.
    const html = render(<LogoRowBlock data={data} locale="en" />);
    expect(html.match(/db-logo-tile/g)).toHaveLength(2);
  });

  it('links a mark only when a target was authored', () => {
    const html = render(<LogoRowBlock data={data} locale="en" />);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('https://example.org');
  });

  it('skips an entry with no mark rather than rendering an empty tile', () => {
    const html = render(<LogoRowBlock data={{ items: [{ name: 'Nobody', logo: '' }] }} locale="en" />);
    expect(html).toBe('');
  });
});

describe('TabsBlock', () => {
  const data = {
    heading: 'Concession',
    items: [
      { label: 'Term', body: '<p>Twenty-five years.</p>' },
      { label: 'Authority', body: '<p>Roads and Highways Department.</p>' },
    ],
  };

  it('is a real ARIA tablist', () => {
    const html = render(<TabsBlock data={data} locale="en" />);
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(2);
    expect(html).toContain('aria-selected="true"');
  });

  it('wires every tab to its panel', () => {
    const html = render(<TabsBlock data={data} locale="en" />);
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
    expect(controls).toHaveLength(2);
    for (const id of controls) expect(html).toContain(`id="${id}"`);
  });

  it('leaves the inactive panel in the DOM so it is indexed and findable', () => {
    const html = render(<TabsBlock data={data} locale="en" />);
    expect(html).toContain('Twenty-five years.');
    expect(html).toContain('Roads and Highways Department.');
  });

  it('renders nothing without panels', () => {
    expect(render(<TabsBlock data={{ items: [] }} locale="en" />)).toBe('');
  });
});

describe('PersonCardBlock', () => {
  const data = {
    heading: 'Board of Directors',
    people: [
      { photo: '/media/chair.webp', name: 'A. Rahman', role: 'Chairman', affiliation: 'SRBG', bio: '<p>Thirty years in highways.</p>' },
      { name: 'F. Begum', role: 'Company Secretary' },
    ],
  };

  it('renders each person with name, role, affiliation and bio', async () => {
    const html = render(await PersonCardBlock({ data, locale: 'en' }));
    expect(html).toContain('A. Rahman');
    expect(html).toContain('Chairman');
    expect(html).toContain('SRBG');
    expect(html).toContain('Thirty years in highways.');
  });

  it('renders a person whose photograph is not in the media library', async () => {
    const html = render(await PersonCardBlock({ data, locale: 'en' }));
    expect(html).toContain('F. Begum');
    expect(html.match(/<img/g)).toHaveLength(1);
  });

  it('renders nothing when nobody is listed', async () => {
    expect(render(await PersonCardBlock({ data: { people: [] }, locale: 'en' }))).toBe('');
  });
});

describe('TimelineBlock', () => {
  const data = {
    heading: 'Project chronology',
    items: [
      { date: '6 December 2018', datetime: '2018-12-06', title: 'Concession signed', description: '<p>DBFOM, 25 years.</p>', image: '/media/chair.webp' },
      { date: '2026', title: 'Full corridor open' },
    ],
  };

  it('is an ordered list, because a chronology has an order', async () => {
    expect(render(await TimelineBlock({ data, locale: 'en' }))).toContain('<ol');
  });

  it('marks up a machine-readable date when one was supplied', async () => {
    const html = render(await TimelineBlock({ data, locale: 'en' }));
    // React writes the `dateTime` property as dateTime="…"; HTML attribute
    // names are case-insensitive, so the browser reads it as datetime. The
    // lower-case prop this used to assert produced React's "invalid DOM
    // property" error on every page with a timeline.
    expect(html).toMatch(/<time date[tT]ime="2018-12-06"/);
    expect(html).toContain('6 December 2018');
  });

  it('renders an entry with no image and no machine date', async () => {
    const html = render(await TimelineBlock({ data, locale: 'en' }));
    expect(html).toContain('Full corridor open');
    expect(html.match(/<img/g)).toHaveLength(1);
  });

  it('renders nothing when the chronology is empty', async () => {
    expect(render(await TimelineBlock({ data: { items: [] }, locale: 'en' }))).toBe('');
  });

  it('announces a milestone percentage through the progress bar, with no copy of its own', async () => {
    const html = render(await TimelineBlock({
      data: { items: [{ date: '2026', title: 'Section 3 widening', progress: 62 }] }, locale: 'en',
    }));
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="62"');
    expect(html).toContain('aria-label="Section 3 widening"');
    expect(html).toContain('width:62%');
  });

  it('draws no bar for a milestone with no progress, or an impossible one', async () => {
    const html = render(await TimelineBlock({
      data: {
        items: [
          { date: '2018', title: 'Signed' },
          { date: '2019', title: 'Typo', progress: 620 },
          { date: '2020', title: 'Blank', progress: '' },
        ],
      },
      locale: 'en',
    }));
    expect(html).not.toContain('role="progressbar"');
  });
});
