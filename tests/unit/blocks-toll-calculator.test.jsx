// tests/unit/blocks-toll-calculator.test.jsx
//
// INT.2's block: three inputs, one fare.
//
// Two things are being defended here and they pull in opposite directions.
//
// The first is that the answer must arrive WITHOUT JAVASCRIPT. Many readers of
// this site are on a low-end Android over mobile data, and a driver checking
// what they will pay must not depend on a bundle loading. So the block is a
// real <form method="get"> whose answer is server-rendered from the query
// string — which is also what makes a result linkable — and every assertion in
// "without a single byte of JavaScript" below is made against
// renderToStaticMarkup, which runs no effects and hydrates nothing. If those
// pass, the no-JS path works, because that IS the no-JS path.
//
// The second is that a single figure has no surrounding grid to be checked
// against, so the provisional warning matters more here than on the matrix.
// The "cannot be edited away" block is the same acceptance test
// blocks-toll-matrix.test.jsx applies, aimed at a block that shows one price
// instead of thirty.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { UI } from '../../lib/i18n/ui.js';

const tollMatrix = vi.fn();
const interchanges = vi.fn();
const sections = vi.fn();

vi.mock('../../lib/corridor/cache', () => ({
  getTollMatrixCached: () => tollMatrix(),
  getInterchangesCached: () => interchanges(),
}));

// Sections live in the traffic reader, not the corridor one: they carry the
// measured speeds and go through `freshSections`, so a stale measurement is
// blanked before it can become a journey time.
vi.mock('../../lib/corridor/traffic-cache', () => ({
  getCorridorSectionSpansCached: () => sections(),
}));

const { default: TollCalculatorBlock } = await import('../../components/blocks/TollCalculatorBlock.jsx');
const { default: def } = await import('../../lib/blocks/types/toll-calculator.js');

const render = async (props) => renderToStaticMarkup(await TollCalculatorBlock(props));

const POINTS = [
  { id: 89, chainage_m: 3218, kind: 'toll_plaza', names: { en: 'Vogra Toll Plaza (RHS)', bn: 'ভোগড়া টোল প্লাজা', zh: '沃格拉收费站' } },
  { id: 91, chainage_m: 11365, kind: 'toll_plaza', names: { en: 'Mirer Bazar (A)' } },
  { id: 97, chainage_m: 45965, kind: 'toll_plaza', names: { en: 'Toll Plaza (K46)' } },
  // A plaza the matrix does not price, and an ordinary interchange. Neither
  // may appear in the pickers.
  { id: 90, chainage_m: 3706, kind: 'toll_plaza', names: { en: 'Vogra Toll Plaza (LHS)' } },
  { id: 81, chainage_m: 0, kind: 'interchange', names: { en: 'Naojor' } },
];

const rate = (o, d, cls, dist, amt, extra = {}) => ({
  id: `${o}-${d}-${cls}`,
  origin_interchange_id: o, destination_interchange_id: d,
  direction: d > o ? 'southbound' : 'northbound',
  vehicle_class: cls,
  class_labels: { en: 'Microbus', bn: 'মাইক্রোবাস', zh: '微型客车' },
  class_order: 3, distance_m: dist, amount_bdt: amt,
  effective_from: '2025-08-23', derivation: 'dbedc-2025-formula',
  sro_number: '', sro_date: '', sro_link: '', is_provisional: 1,
  ...extra,
});

const RATES = [
  rate(89, 97, 'microbus', 42747, '320.00'),
  rate(97, 89, 'microbus', 42747, '300.00'),
  rate(89, 91, 'microbus', 8147, '120.00'),
  rate(91, 89, 'microbus', 8147, '120.00'),
];

const DATA = {
  heading: 'What will my journey cost?',
  entryLabel: 'Where you join',
  exitLabel: 'Where you leave',
  vehicleLabel: 'Your vehicle',
  submitLabel: 'Show the toll',
  fareLabel: 'Toll payable',
  distanceLabel: 'Distance',
  timeLabel: 'Estimated journey time',
  timeUnit: 'min',
  samePointMessage: 'Choose two different toll plazas.',
  unpricedMessage: 'No fare is published for that journey yet.',
};

const query = (from, to, vehicle) => ({ from, to, class: vehicle });

beforeEach(() => {
  vi.clearAllMocks();
  tollMatrix.mockResolvedValue(RATES);
  interchanges.mockResolvedValue(POINTS);
  sections.mockResolvedValue([]);
});

describe('the block type', () => {
  it('stores presentation only — no fare, no distance, no plaza is authorable', () => {
    const names = def.fields.map((f) => f.name);
    for (const forbidden of ['amount', 'amount_bdt', 'fare', 'distance', 'origin', 'destination', 'minutes', 'speed']) {
      expect(names).not.toContain(forbidden);
    }
  });

  it('carries no field that could switch the provisional notice off', () => {
    const names = def.fields.map((f) => f.name.toLowerCase());
    expect(names.some((n) => /provisional|notice|confirm|warn|disclaim/.test(n))).toBe(false);
    expect(def.fields.some((f) => f.type === 'checkbox' || f.type === 'boolean')).toBe(false);
  });

  it('is registered under a label an operator can find', () => {
    expect(def.type).toBe('toll-calculator');
    expect(typeof def.label).toBe('string');
    expect(def.label.length).toBeGreaterThan(0);
  });
});

describe('without a single byte of JavaScript', () => {
  it('is a real GET form, so the answer is in the URL and the URL is shareable', async () => {
    const html = await render({ data: DATA, locale: 'en' });
    expect(html).toContain('method="get"');
    // No action: the form submits to the page it is on, whatever that page is.
    expect(html).not.toContain('action=');
    expect(html).toContain('name="from"');
    expect(html).toContain('name="to"');
    expect(html).toContain('name="class"');
  });

  it('offers only the plazas the fare table prices, in road order', async () => {
    const html = await render({ data: DATA, locale: 'en' });
    expect(html).toContain('Vogra Toll Plaza (RHS)');
    expect(html).toContain('Mirer Bazar (A)');
    expect(html).toContain('Toll Plaza (K46)');
    // Priced by nothing, so offered by nothing.
    expect(html).not.toContain('Vogra Toll Plaza (LHS)');
    // Not a toll plaza at all.
    expect(html).not.toContain('Naojor');
    const order = ['Vogra Toll Plaza (RHS)', 'Mirer Bazar (A)', 'Toll Plaza (K46)']
      .map((n) => html.indexOf(n));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('names the vehicle classes from the toll record, in the reader\'s language', async () => {
    expect(await render({ data: DATA, locale: 'bn' })).toContain('মাইক্রোবাস');
    expect(await render({ data: DATA, locale: 'zh' })).toContain('微型客车');
  });

  it('server-renders the fare for a selection carried in the query string', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toContain('৳ 320');
    expect(html).toContain('42.7');
  });

  it('takes the direction from the two chainages, not from the reader', async () => {
    const south = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    const north = await render({ data: DATA, locale: 'en', searchParams: query('97', '89', 'microbus') });
    expect(south).toContain('৳ 320');
    expect(north).toContain('৳ 300');
    // Nothing in the form lets a visitor state a direction.
    expect(south).not.toContain('name="direction"');
  });

  it('accepts searchParams as a promise, the shape Next 15 actually passes', async () => {
    const html = await render({
      data: DATA, locale: 'en', searchParams: Promise.resolve(query('89', '97', 'microbus')),
    });
    expect(html).toContain('৳ 320');
  });

  it('keeps the visitor\'s choice selected so the form reads back what was asked', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toMatch(/<option[^>]*value="89"[^>]*selected/);
    expect(html).toMatch(/<option[^>]*value="97"[^>]*selected/);
    expect(html).toMatch(/<option[^>]*value="microbus"[^>]*selected/);
  });
});

describe('the ways a journey is not a journey', () => {
  it('refuses the same plaza twice, with no figure of any kind', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '89', 'microbus') });
    expect(html).toContain('Choose two different toll plazas.');
    expect(html).not.toContain('৳');
    expect(html).toContain('aria-invalid="true"');
  });

  it('says an unpriced journey is unpriced and never borrows a nearby fare', async () => {
    // 91 -> 97 is a real journey with no row in this matrix.
    const html = await render({ data: DATA, locale: 'en', searchParams: query('91', '97', 'microbus') });
    expect(html).toContain('No fare is published for that journey yet.');
    expect(html).not.toContain('৳ 320');
    expect(html).not.toContain('৳ 120');
    expect(html).not.toContain('৳');
  });

  it('falls back to an editable string rather than silence when nothing is authored', async () => {
    const html = await render({ data: {}, locale: 'en', searchParams: query('91', '97', 'microbus') });
    expect(html).toContain(UI.en.noTollRates);
  });

  it('shows no fare for a half-filled form', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: { from: '89' } });
    expect(html).not.toContain('৳');
  });

  it('shows no fare for a hand-edited id that is not a tolling point', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('81', '97', 'microbus') });
    expect(html).not.toContain('৳');
  });

  it('renders the form, not a stack trace, when both readers are dead', async () => {
    tollMatrix.mockRejectedValue(new Error('no database'));
    interchanges.mockRejectedValue(new Error('no database'));
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toContain(UI.en.noTollRates);
    expect(html).not.toContain('৳');
  });
});

describe('the provisional warning cannot be edited away', () => {
  const HOSTILE = [
    { ...DATA, provisional: false },
    { ...DATA, isProvisional: false },
    { ...DATA, showProvisional: false },
    { ...DATA, hideNotice: true },
    { ...DATA, notice: '' },
    { ...DATA, provisionalBody: '' },
    { ...DATA, confirmed: true },
    { ...DATA, disclaimer: null },
  ];

  it.each(HOSTILE.map((d, i) => [i, d]))('config %i cannot suppress it', async (_i, data) => {
    const html = await render({ data, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toContain(UI.en.provisional);
    expect(html).toContain(UI.en.provisionalBody);
  });

  it('binds the notice to the answer, so it is announced before the figure is read', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    const id = /aria-describedby="([^"]+)"/.exec(html);
    expect(id).not.toBeNull();
    expect(html).toContain(`id="${id[1]}"`);
  });

  it('rides on the row: a fare with its gazette citation drops the warning', async () => {
    tollMatrix.mockResolvedValue([rate(89, 97, 'microbus', 42747, '320.00', {
      is_provisional: 0, sro_number: 'S.R.O. 214-Law/2025', sro_date: '23 August 2025',
    })]);
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toContain('৳ 320');
    expect(html).not.toContain(UI.en.provisional);
    expect(html).toContain('S.R.O. 214-Law/2025');
  });

  it('a forged is_provisional=0 with no citation still carries the warning', async () => {
    tollMatrix.mockResolvedValue([rate(89, 97, 'microbus', 42747, '320.00', { is_provisional: 0 })]);
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toContain(UI.en.provisional);
  });

  it('says it in the reader\'s language', async () => {
    for (const locale of ['bn', 'zh']) {
      const html = await render({ data: DATA, locale, searchParams: query('89', '97', 'microbus') });
      expect(html).toContain(UI[locale].provisional);
      expect(html).toContain(UI[locale].provisionalBody);
    }
  });
});

describe('journey time is derived or omitted, never invented', () => {
  it('omits the figure and says why while the corridor is unmeasured', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toContain('Estimated journey time');
    expect(html).toContain(UI.en.traffic_unknown);
    expect(html).not.toContain('min<');
  });

  it('shows a time once every section crossed carries a measured speed', async () => {
    sections.mockResolvedValue([
      { id: 1, from_m: 0, to_m: 50000, avg_speed_kmh: 60, measured_at: '2026-09-10 08:00:00' },
    ]);
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toContain('43');
    expect(html).toContain('min');
  });

  it('omits the whole row when the operator has not authored a label for it', async () => {
    sections.mockResolvedValue([
      { id: 1, from_m: 0, to_m: 50000, avg_speed_kmh: 60, measured_at: '2026-09-10 08:00:00' },
    ]);
    const html = await render({
      data: { ...DATA, timeLabel: '', timeUnit: '' }, locale: 'en', searchParams: query('89', '97', 'microbus'),
    });
    expect(html).not.toContain('Estimated journey time');
    expect(html).not.toContain('43');
  });
});

describe('accessibility is not optional here', () => {
  it('gives every control a real label bound to it', async () => {
    const html = await render({ data: DATA, locale: 'en' });
    for (const [text, name] of [['Where you join', 'from'], ['Where you leave', 'to'], ['Your vehicle', 'class']]) {
      const label = new RegExp(`<label[^>]*for="([^"]+)"[^>]*>${text}`).exec(html);
      expect(label, `no label for ${name}`).not.toBeNull();
      expect(html).toContain(`id="${label[1]}"`);
      expect(html).toMatch(new RegExp(`<select[^>]*id="${label[1]}"[^>]*name="${name}"`));
    }
  });

  it('falls back to an editable UI string when a label is not authored', async () => {
    const html = await render({ data: {}, locale: 'en' });
    expect(html).toContain(UI.en.mapStartPoint);
    expect(html).toContain(UI.en.mapEndPoint);
    expect(html).toContain(UI.en.colVehicle);
    expect(html).toContain(UI.en.colToll);
  });

  it('announces the answer when it changes', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    expect(html).toMatch(/role="status"/);
    expect(html).toMatch(/aria-live="polite"/);
  });

  it('uses the 44px controls and the tabular figures the design system already defines', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    // .db-input and .db-btn are both min-height:var(--db-tap).
    expect(html).toContain('class="db-input"');
    expect(html).toContain('db-btn db-btn-primary');
    // .db-num is the design system's tabular-figures class — the same one the
    // toll table and the interchange table already put on their figures.
    expect(html).toContain('db-num');
  });

  it('lets the browser enforce completeness with no script at all', async () => {
    const html = await render({ data: DATA, locale: 'en' });
    expect((html.match(/required/g) || []).length).toBe(3);
  });

  it('uses no raw Tailwind utility class in a public component', async () => {
    const html = await render({ data: DATA, locale: 'en', searchParams: query('89', '97', 'microbus') });
    for (const cls of (html.match(/class="([^"]*)"/g) || [])) {
      for (const name of cls.slice(7, -1).split(/\s+/).filter(Boolean)) {
        expect(name, `${name} is not a design-system class`).toMatch(/^db-/);
      }
    }
  });
});
