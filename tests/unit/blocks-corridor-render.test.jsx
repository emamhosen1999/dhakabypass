// tests/unit/blocks-corridor-render.test.jsx
//
// What the three live corridor blocks actually put on the page.
//
// The accessibility assertions are the point rather than decoration:
// Bangladesh's ICTD Inclusive Accessibility Guideline 2022 is WCAG 2.1
// aligned, so a rate schedule without a caption or row headers is a defect.
// So is a block that renders nothing at all when a query fails — a page with
// a silent hole in it is one nobody notices is broken.
//
// The cached readers are mocked at the module boundary, which is also what
// makes "the database is down" a testable state rather than an assumption:
// each reader can be made to reject exactly as it would in an outage.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const tollRates = vi.fn();
const interchanges = vi.fn();
const advisories = vi.fn();
const sectionStatus = vi.fn();

vi.mock('../../lib/corridor/cache', () => ({
  getTollRatesCached: () => tollRates(),
  getInterchangesCached: () => interchanges(),
  getActiveAdvisoriesCached: () => advisories(),
}));

vi.mock('../../lib/corridor/traffic-cache', () => ({
  getSectionStatusCached: () => sectionStatus(),
}));

const { default: TollTableBlock } = await import('../../components/blocks/TollTableBlock.jsx');
const { default: TrafficStatusBlock } = await import('../../components/blocks/TrafficStatusBlock.jsx');
const { default: InterchangeTableBlock } = await import('../../components/blocks/InterchangeTableBlock.jsx');

/** Async server components are async functions returning elements. */
const render = async (Component, props) => renderToStaticMarkup(await Component(props));

const RATES = [
  { id: 1, vehicle_class: 'car', class_order: 1, class_labels: { en: 'Car', bn: 'কার' }, section: 'Vogra – Purbachal', amount_bdt: '150.00' },
  { id: 2, vehicle_class: 'large_bus', class_order: 6, class_labels: { en: 'Large bus' }, section: 'Vogra – Purbachal', amount_bdt: '310.00' },
];

const SECTIONS = {
  source: 'operator',
  waypoints: [{ code: 'S', names: { en: 'Naojor', bn: 'নাওজোড়' } }, { code: '2', names: null }],
  sections: [
    { id: 1, from_code: 'S', to_code: '2', sort_order: 0, condition_key: 'heavy', avg_speed_kmh: 14, measured_at: '2026-09-07T04:30:00.000Z' },
    { id: 2, from_code: '2', to_code: '3', sort_order: 1, condition_key: 'free', avg_speed_kmh: 82, measured_at: null },
  ],
};

const PLACES = [
  { id: 1, chainage_m: 12090, names: { en: 'Kanchan', bn: 'কাঞ্চন' }, kind: 'toll_plaza', status: 'open', connects_to: 'N105', facilities: ['Fuel'] },
  { id: 2, chainage_m: 500, names: { en: 'Waypoint 3' }, kind: 'waypoint', status: 'open', connects_to: '', facilities: [] },
];

beforeEach(() => {
  tollRates.mockResolvedValue(RATES);
  interchanges.mockResolvedValue(PLACES);
  advisories.mockResolvedValue([]);
  sectionStatus.mockResolvedValue(SECTIONS);
});

describe('TollTableBlock', () => {
  const data = { heading: 'Toll rates', intro: 'What each vehicle pays.' };

  it('renders a real caption, column headers and a row header per rate', async () => {
    const html = await render(TollTableBlock, { data, locale: 'en' });
    expect(html).toContain('<caption');
    expect(html).toContain('<th scope="col">Vehicle class</th>');
    expect(html).toContain('<th scope="row">Car</th>');
  });

  it('falls back to the editable caption string when none is authored', async () => {
    const html = await render(TollTableBlock, { data, locale: 'en' });
    // The accessibility outcome is guaranteed by the fallback rather than by a
    // required field that would only block a save.
    expect(html).toContain('Toll rates currently in force.');
  });

  it('reads the amounts live — they are never authored on the block', async () => {
    const html = await render(TollTableBlock, { data, locale: 'en' });
    expect(html).toContain('৳ 150');
    expect(html).toContain('৳ 310');
  });

  it('names the vehicle in the reader’s language', async () => {
    expect(await render(TollTableBlock, { data, locale: 'bn' })).toContain('কার');
  });

  it('scrolls inside its own box, never making the page body scroll sideways', async () => {
    expect(await render(TollTableBlock, { data, locale: 'en' })).toContain('db-scroll-x');
  });

  it('carries db-datatable, which is what gives it the print rules', async () => {
    // Toll rate cards are printed and pinned up in transport offices; the
    // print block in app/design-tokens.css keys off this class.
    expect(await render(TollTableBlock, { data, locale: 'en' })).toContain('db-datatable');
  });

  it('binds the gazette citation from the rate records to the table inside one figure', async () => {
    tollRates.mockResolvedValue(RATES.map((r) => ({
      ...r, sro_number: 'S.R.O. No. 128-Law/2023', sro_date: '14 May 2023', sro_link: '/uploads/sro-128.pdf',
    })));
    const html = await render(TollTableBlock, {
      data: { ...data, revisionMechanism: 'Revised every three years.' },
      locale: 'en',
    });
    expect(html).toContain('<figure');
    expect(html).toContain('<figcaption');
    // The S.R.O. number is the link text: a good accessible name, where a
    // bare URL would be one a screen-reader user cannot place.
    expect(html).toContain('href="/uploads/sro-128.pdf"');
    expect(html).toContain('S.R.O. No. 128-Law/2023');
    expect(html).toContain('14 May 2023');
    expect(html).toContain('Revised every three years.');
    // The citation comes after the table, inside the same figure.
    expect(html.indexOf('<figcaption')).toBeGreaterThan(html.indexOf('<table'));
  });

  it('renders no empty citation line when none has been authored', async () => {
    const html = await render(TollTableBlock, { data, locale: 'en' });
    expect(html).not.toContain('<figcaption');
    expect(html).toContain('<table');
  });

  it('drops the section column when no rate names a section', async () => {
    tollRates.mockResolvedValue(RATES.map((r) => ({ ...r, section: '' })));
    const html = await render(TollTableBlock, { data, locale: 'en' });
    expect(html).not.toContain('>Section<');
  });

  it('shows the authored empty message when nothing is published', async () => {
    tollRates.mockResolvedValue([]);
    const html = await render(TollTableBlock, { data: { ...data, emptyMessage: 'Rates are being confirmed.' }, locale: 'en' });
    expect(html).toContain('Toll rates');
    expect(html).toContain('Rates are being confirmed.');
    expect(html).not.toContain('<table');
  });

  it('degrades to the editable empty string, not a blank hole, when the database is down', async () => {
    tollRates.mockRejectedValue(new Error('ECONNREFUSED'));
    const html = await render(TollTableBlock, { data, locale: 'en' });
    expect(html).toContain('No toll rates have been published yet.');
    expect(html).toContain('Toll rates');
  });

  it('hides the citation when there are no rates for it to certify', async () => {
    tollRates.mockResolvedValue([]);
    const html = await render(TollTableBlock, { data: { ...data, sroNumber: 'S.R.O. 128' }, locale: 'en' });
    expect(html).not.toContain('S.R.O. 128');
  });
});

describe('TrafficStatusBlock', () => {
  const data = { heading: 'Live corridor status' };

  it('renders one row per section, with the condition as a WORD', async () => {
    const html = await render(TrafficStatusBlock, { data, locale: 'en' });
    // Colour is never the only carrier of status.
    expect(html).toContain('Heavy');
    expect(html).toContain('Free flow');
  });

  it('names a section by its waypoints, falling back to the map’s own wording', async () => {
    const html = await render(TrafficStatusBlock, { data, locale: 'en' });
    expect(html).toContain('Naojor');
    expect(html).toContain('Waypoint 2');
  });

  it('prints the measurement time as a machine-readable Dhaka instant', async () => {
    const html = await render(TrafficStatusBlock, { data, locale: 'en' });
    // 04:30 UTC is 10:30 in Dhaka — a fixed UTC+6 with no daylight saving,
    // which is why the offset is arithmetic here and not a timezone database.
    // The attribute name is matched case-insensitively: React 19 emits the
    // JSX spelling `dateTime` verbatim and relies on HTML attribute names
    // being case-insensitive, which they are.
    expect(html).toMatch(/datetime="2026-09-07T10:30:00\+06:00"/i);
    expect(html).toContain('10:30');
  });

  it('shows a dash rather than 0 km/h where no speed was measured', async () => {
    sectionStatus.mockResolvedValue({
      ...SECTIONS,
      sections: [{ ...SECTIONS.sections[0], avg_speed_kmh: 0 }],
    });
    const html = await render(TrafficStatusBlock, { data, locale: 'en' });
    expect(html).not.toContain('>0<');
  });

  it('renders the legend by default and drops it when switched off', async () => {
    expect(await render(TrafficStatusBlock, { data, locale: 'en' })).toContain('db-statuslegend');
    expect(await render(TrafficStatusBlock, { data: { ...data, showLegend: 'no' }, locale: 'en' }))
      .not.toContain('db-statuslegend');
  });

  it('says so while the conditions are sample data', async () => {
    sectionStatus.mockResolvedValue({ ...SECTIONS, source: 'sample' });
    const html = await render(TrafficStatusBlock, { data, locale: 'en' });
    expect(html).toContain('Sample data');
  });

  it('lets an operator reword that notice but not remove it', async () => {
    sectionStatus.mockResolvedValue({ ...SECTIONS, source: 'sample' });
    const html = await render(TrafficStatusBlock, {
      data: { ...data, sourceNotice: 'Figures shown are illustrative.' }, locale: 'en',
    });
    expect(html).toContain('Sample data');
    expect(html).toContain('Figures shown are illustrative.');
  });

  it('prints an active advisory above the table, with its severity as a word', async () => {
    advisories.mockResolvedValue([
      { id: 9, severity: 'closure', messages: { en: 'Kanchan northbound closed overnight.' } },
    ]);
    const html = await render(TrafficStatusBlock, { data, locale: 'en' });
    expect(html).toContain('Kanchan northbound closed overnight.');
    expect(html).toContain('Closure');
    // Standing context, not an interruption on every client-side navigation.
    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });

  it('still shows the advisory when the section query is the thing that failed', async () => {
    // Settled independently: an outage on one reader must not swallow a live
    // closure notice published through the other.
    sectionStatus.mockRejectedValue(new Error('ECONNREFUSED'));
    advisories.mockResolvedValue([{ id: 9, severity: 'closure', messages: { en: 'Road closed.' } }]);
    const html = await render(TrafficStatusBlock, { data, locale: 'en' });
    expect(html).toContain('Road closed.');
    expect(html).toContain('No sections have been published yet.');
  });

  it('degrades to the authored empty message when everything is down', async () => {
    sectionStatus.mockRejectedValue(new Error('down'));
    advisories.mockRejectedValue(new Error('down'));
    const html = await render(TrafficStatusBlock, {
      data: { ...data, emptyMessage: 'Live status is unavailable.' }, locale: 'en',
    });
    expect(html).toContain('Live corridor status');
    expect(html).toContain('Live status is unavailable.');
  });

  it('shows the empty message rather than the whole corridor when the filter matches nothing', async () => {
    const html = await render(TrafficStatusBlock, { data: { ...data, sections: ['X-Y'] }, locale: 'en' });
    expect(html).not.toContain('Naojor');
    expect(html).toContain('No sections have been published yet.');
  });
});

describe('InterchangeTableBlock', () => {
  const data = { heading: 'Interchanges' };

  it('renders a caption, column headers and a row header per record', async () => {
    const html = await render(InterchangeTableBlock, { data, locale: 'en' });
    expect(html).toContain('<caption');
    expect(html).toContain('<th scope="col">Location</th>');
    expect(html).toContain('<th scope="row">Kanchan</th>');
  });

  it('leaves survey waypoints out — they are geometry, not destinations', async () => {
    expect(await render(InterchangeTableBlock, { data, locale: 'en' })).not.toContain('Waypoint 3');
  });

  it('names the place in the reader’s language', async () => {
    expect(await render(InterchangeTableBlock, { data, locale: 'bn' })).toContain('কাঞ্চন');
  });

  it('formats chainage in the notation the gazette uses, with tabular figures', async () => {
    const html = await render(InterchangeTableBlock, { data, locale: 'en' });
    expect(html).toContain('K12+090');
    expect(html).toContain('db-num');
  });

  it('carries status as a word as well as a tag colour', async () => {
    expect(await render(InterchangeTableBlock, { data, locale: 'en' })).toContain('Open to traffic');
  });

  it('hides only the columns switched off, and never the location column', async () => {
    const html = await render(InterchangeTableBlock, {
      data: { ...data, showChainage: 'no', showConnects: 'no' }, locale: 'en',
    });
    expect(html).not.toContain('K12+090');
    expect(html).not.toContain('>Connects<');
    expect(html).toContain('<th scope="col">Location</th>');
    expect(html).toContain('<th scope="row">Kanchan</th>');
  });

  it('shows facilities as a list when the column is switched on', async () => {
    const html = await render(InterchangeTableBlock, {
      data: { ...data, showFacilities: 'yes' }, locale: 'en',
    });
    expect(html).toContain('>Facilities<');
    expect(html).toContain('Fuel');
  });

  it('degrades to the editable empty string when the database is down', async () => {
    interchanges.mockRejectedValue(new Error('ECONNREFUSED'));
    const html = await render(InterchangeTableBlock, { data, locale: 'en' });
    expect(html).toContain('Interchanges');
    expect(html).toContain('No interchanges have been published yet.');
  });

  it('shows the authored empty message when one is given', async () => {
    interchanges.mockResolvedValue([]);
    const html = await render(InterchangeTableBlock, {
      data: { ...data, emptyMessage: 'The junction list is being confirmed.' }, locale: 'en',
    });
    expect(html).toContain('The junction list is being confirmed.');
  });
});
