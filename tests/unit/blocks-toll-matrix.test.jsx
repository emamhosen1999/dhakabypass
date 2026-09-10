// tests/unit/blocks-toll-matrix.test.jsx
//
// The only thing on the public site that renders an O–D fare.
//
// Half of this file is ordinary block-rendering coverage. The other half —
// the "cannot be edited away" describe block — is the acceptance test for the
// constraint the whole task hangs on: a driver reading ৳260 here and paying
// ৳400 at the plaza is a worse outcome than a page that shows nothing, so the
// provisional notice must not be something an operator can switch off, blank
// out or lose by mistyping a field name.
//
// The block owns presentation only. The fares, the distances and the
// provisional flag all come from `toll_od_rates` through the cached reader —
// the records-vs-blocks rule the client locked on 2026-09-06.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { UI } from '../../lib/i18n/ui.js';

const tollMatrix = vi.fn();
const interchanges = vi.fn();

vi.mock('../../lib/corridor/cache', () => ({
  getTollMatrixCached: () => tollMatrix(),
  getInterchangesCached: () => interchanges(),
}));

const { default: TollMatrixBlock } = await import('../../components/blocks/TollMatrixBlock.jsx');
const { default: def } = await import('../../lib/blocks/types/toll-matrix.js');

const render = async (props) => renderToStaticMarkup(await TollMatrixBlock(props));

const POINTS = [
  { id: 89, chainage_m: 3218, kind: 'toll_plaza', names: { en: 'Vogra Toll Plaza', bn: 'ভোগড়া টোল প্লাজা', zh: '沃格拉收费站' } },
  { id: 91, chainage_m: 11365, kind: 'toll_plaza', names: { en: 'Mirer Bazar', bn: 'মীরের বাজার', zh: '米雷尔集市' } },
  { id: 94, chainage_m: 24522, kind: 'toll_plaza', names: { en: 'Purbachal Toll Plaza' } },
  { id: 81, chainage_m: 0, kind: 'interchange', names: { en: 'Naojor' } },
];

const row = (o, d, cls, dist, amt, extra = {}) => ({
  id: `${o}-${d}-${cls}`,
  origin_interchange_id: o, destination_interchange_id: d,
  direction: d > o ? 'southbound' : 'northbound',
  vehicle_class: cls, class_labels: { en: 'Sedan / Private Car', bn: 'প্রাইভেট কার', zh: '小轿车' },
  class_order: 1, distance_m: dist, amount_bdt: amt,
  effective_from: '2025-08-23', derivation: 'dbedc-2025-formula',
  sro_number: '', sro_date: '', sro_link: '', is_provisional: 1,
  ...extra,
});

const PROVISIONAL = [
  row(89, 91, 'car', 8147, '100.00'),
  row(91, 89, 'car', 8147, '100.00'),
  row(89, 94, 'car', 21304, '150.00'),
  row(94, 89, 'car', 21304, '150.00'),
];

const CONFIRMED = PROVISIONAL.map((r) => ({
  ...r, is_provisional: 0,
  sro_number: 'S.R.O. 214-Law/2025', sro_date: '23 August 2025',
  sro_link: 'https://example.gov.bd/sro-214.pdf',
}));

beforeEach(() => {
  vi.clearAllMocks();
  tollMatrix.mockResolvedValue(PROVISIONAL);
  interchanges.mockResolvedValue(POINTS);
});

describe('the block type', () => {
  it('stores presentation only — no amount, no distance, no plaza is authorable', () => {
    const names = def.fields.map((f) => f.name);
    for (const forbidden of ['amount', 'amount_bdt', 'fare', 'distance', 'origin', 'destination']) {
      expect(names).not.toContain(forbidden);
    }
  });

  it('carries no field that could switch the provisional notice off', () => {
    const names = def.fields.map((f) => f.name.toLowerCase());
    expect(names.some((n) => /provisional|notice|confirm|warn|disclaim/.test(n))).toBe(false);
    expect(def.fields.some((f) => f.type === 'checkbox' || f.type === 'boolean')).toBe(false);
  });
});

describe('what it renders', () => {
  it('is a real table with a caption and header cells in both directions', async () => {
    const html = await render({ data: {}, locale: 'en' });
    expect(html).toContain('<table');
    expect(html).toContain('<caption');
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
  });

  it('reads plaza names from the interchange records, in the reader’s language', async () => {
    const bn = await render({ data: {}, locale: 'bn' });
    expect(bn).toContain('ভোগড়া টোল প্লাজা');
    expect(bn).toContain('মীরের বাজার');
    const zh = await render({ data: {}, locale: 'zh' });
    expect(zh).toContain('沃格拉收费站');
    // No Chinese name recorded for Purbachal: falls back to English rather
    // than to a blank header cell over a column of prices.
    expect(zh).toContain('Purbachal Toll Plaza');
  });

  it('prints the fare and the distance for each ordered pair', async () => {
    const html = await render({ data: {}, locale: 'en' });
    expect(html).toContain('৳ 100');
    expect(html).toContain('৳ 150');
    expect(html).toContain('21.3');
  });

  it('sets tabular figures on every fare and distance', async () => {
    const html = await render({ data: {}, locale: 'en' });
    // .db-num and .db-toll-amount both carry font-variant-numeric:tabular-nums
    // in app/design-tokens.css — columns of taka that do not line up are hard
    // to compare, which is the entire job of a matrix.
    expect(html).toMatch(/class="[^"]*db-toll-amount/);
    expect(html).toMatch(/class="[^"]*db-num/);
  });

  it('leaves the diagonal and any missing pair empty rather than inventing a fare', async () => {
    tollMatrix.mockResolvedValue([row(89, 91, 'car', 8147, '100.00')]);
    const html = await render({ data: {}, locale: 'en' });
    expect(html).toContain('—');
  });

  it('renders the operator’s empty message, not a hole, when there are no fares', async () => {
    tollMatrix.mockResolvedValue([]);
    const html = await render({ data: { emptyMessage: 'No O–D fares published yet.' }, locale: 'en' });
    expect(html).toContain('No O–D fares published yet.');
    expect(html).not.toContain('<table');
  });

  it('survives a dead database the same way TollTableBlock does', async () => {
    tollMatrix.mockRejectedValue(new Error('ECONNREFUSED'));
    interchanges.mockRejectedValue(new Error('ECONNREFUSED'));
    const html = await render({ data: {}, locale: 'en' });
    expect(html).toContain(UI.en.noTollRates);
    expect(html).not.toContain('<table');
  });

  it('shows the class the operator chose, and only that class', async () => {
    tollMatrix.mockResolvedValue([
      ...PROVISIONAL,
      row(89, 91, 'large_bus', 8147, '170.00', { class_labels: { en: 'Large Bus' }, class_order: 6 }),
    ]);
    const html = await render({ data: { vehicleClass: 'large_bus' }, locale: 'en' });
    expect(html).toContain('৳ 170');
    expect(html).not.toContain('৳ 100');
  });
});

// ---------------------------------------------------------------------------
describe('the provisional notice cannot be edited away', () => {
  const HOSTILE = [
    {}, { provisional: false }, { showNotice: false }, { hideNotice: true },
    { heading: '', intro: '', caption: '', emptyMessage: '' },
    { provisionalBody: '' }, { notice: '' }, { sroNumber: 'S.R.O. 1/2025' },
  ];

  it.each(HOSTILE)('still renders it for block data %j', async (data) => {
    const html = await render({ data, locale: 'en' });
    expect(html).toContain('db-illustrative');
    expect(html).toContain(UI.en.provisional);
    expect(html).toContain(UI.en.provisionalBody);
  });

  it('renders it in Bangla and Chinese too', async () => {
    expect(await render({ data: {}, locale: 'bn' })).toContain(UI.bn.provisionalBody);
    expect(await render({ data: {}, locale: 'zh' })).toContain(UI.zh.provisionalBody);
  });

  // The notice can be missed visually. Binding it to the table with
  // aria-describedby means a screen-reader user entering the grid of prices
  // hears "these figures are awaiting official confirmation" before reading a
  // single one of them.
  it('binds the notice to the table so it is announced with the prices', async () => {
    const html = await render({ data: {}, locale: 'en' });
    const id = /id="([^"]+)"[^>]*class="db-illustrative"|class="db-illustrative"[^>]*id="([^"]+)"/.exec(html);
    const noticeId = id && (id[1] || id[2]);
    expect(noticeId).toBeTruthy();
    expect(html).toContain(`aria-describedby="${noticeId}"`);
  });

  it('drops the notice ONLY when every shown fare carries its S.R.O. citation', async () => {
    tollMatrix.mockResolvedValue(CONFIRMED);
    const html = await render({ data: {}, locale: 'en' });
    expect(html).not.toContain('db-illustrative');
    expect(html).toContain('S.R.O. 214-Law/2025');
    expect(html).toContain('https://example.gov.bd/sro-214.pdf');
  });

  it('keeps the notice when even one shown fare is still provisional', async () => {
    tollMatrix.mockResolvedValue([...CONFIRMED.slice(1), PROVISIONAL[0]]);
    const html = await render({ data: {}, locale: 'en' });
    expect(html).toContain('db-illustrative');
  });

  it('ignores a row that claims to be confirmed without a citation', async () => {
    // is_provisional is a generated column, so this row cannot exist in a
    // database that ran the DDL. It can arrive from a hand-built fixture, an
    // import or a future replication mishap — and the render must still fail
    // towards the warning.
    tollMatrix.mockResolvedValue([{ ...PROVISIONAL[0], is_provisional: 0, sro_number: '' }]);
    const html = await render({ data: {}, locale: 'en' });
    expect(html).toContain('db-illustrative');
  });
});
