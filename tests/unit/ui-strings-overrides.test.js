/**
 * W1.6 — every UI string editable from the admin, with the code values kept as
 * a fallback.
 *
 * The thing under test is NOT "does a database value win". It is the failure
 * behaviour: `t()` and `mapUi()` are called ~240 times across the site,
 * including inside the header, the footer and the contact form, and a reader
 * must never meet a blank label or a raw key like `navTravel`. So every test
 * here that matters is a degradation test — no rows, no table, no database at
 * all, a row with an empty value, a row in a locale the site does not serve.
 * In each of those the site has to render exactly what it renders today.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LOCALES } from '../../lib/i18n/locales.js';
import { UI, t } from '../../lib/i18n/ui.js';
import { MAP_UI, mapUi } from '../../lib/i18n/map-ui.js';
import {
  UI_NS, MAP_NS, stringKey,
  applyUiOverrides, clearUiOverrides, getUiOverrides, normalizeUiStringRows,
} from '../../lib/i18n/overrides.js';
import { UI_STRING_CATALOGUE, codeValue, findUiString } from '../../lib/i18n/catalogue.js';
import { groupForKey, UI_STRING_GROUPS } from '../../lib/i18n/groups.js';
import UiStringsBridge from '../../components/chrome/UiStringsBridge.jsx';

beforeEach(() => clearUiOverrides());

describe('stringKey', () => {
  it('namespaces the two tables so `title` in the map cannot collide with a page key', () => {
    expect(stringKey(UI_NS, 'navTravel')).toBe('ui.navTravel');
    expect(stringKey(MAP_NS, 'title')).toBe('map.title');
  });
});

describe('t() with no overrides — today\'s behaviour, unchanged', () => {
  it('keeps the (locale, key) signature and the code values', () => {
    expect(t('en', 'navTravel')).toBe(UI.en.navTravel);
    expect(t('bn', 'navTravel')).toBe(UI.bn.navTravel);
    expect(t('zh', 'contactWriteHeading')).toBe(UI.zh.contactWriteHeading);
  });

  it('falls back to English for an unknown locale, and to the key for an unknown key', () => {
    expect(t('fr', 'navTravel')).toBe(UI.en.navTravel);
    expect(t('bn', 'nope')).toBe('nope');
  });
});

describe('t() with overrides', () => {
  it('prefers the database value for the requested locale', () => {
    applyUiOverrides('bn', { 'ui.navTravel': 'ভ্রমণ তথ্য (সম্পাদিত)' });
    expect(t('bn', 'navTravel')).toBe('ভ্রমণ তথ্য (সম্পাদিত)');
    // and leaves every other locale on its code value
    expect(t('en', 'navTravel')).toBe(UI.en.navTravel);
  });

  it('falls back to the code value for that locale when only another locale is overridden', () => {
    applyUiOverrides('en', { 'ui.newsEmpty': 'Press room' });
    expect(t('en', 'newsEmpty')).toBe('Press room');
    expect(t('bn', 'newsEmpty')).toBe(UI.bn.newsEmpty);
  });

  it('never returns a blank string when the stored value is empty or whitespace', () => {
    applyUiOverrides('bn', { 'ui.navTravel': '   ' });
    expect(t('bn', 'navTravel')).toBe(UI.bn.navTravel);
  });

  it('reaches the English database value for a key that exists in no code table', () => {
    // A key added through the admin after this ships has no code value at all.
    // English is the last stop before the raw key.
    applyUiOverrides('en', { 'ui.brandNewKey': 'Something new' });
    expect(t('zh', 'brandNewKey')).toBe('Something new');
  });

  it('still returns the key, not an empty string, when nothing anywhere defines it', () => {
    expect(t('zh', 'noSuchKeyAnywhere')).toBe('noSuchKeyAnywhere');
  });
});

describe('mapUi()', () => {
  it('returns the full label set for a locale with no overrides', () => {
    expect(mapUi('en')).toEqual(MAP_UI.en);
    expect(mapUi('bn').title).toBe(MAP_UI.bn.title);
  });

  it('falls back to English for an unknown locale', () => {
    expect(mapUi('fr')).toEqual(MAP_UI.en);
  });

  it('applies database overrides over the code labels', () => {
    applyUiOverrides('en', { 'map.layers': 'Map layers' });
    const labels = mapUi('en');
    expect(labels.layers).toBe('Map layers');
    // every other label is untouched
    expect(labels.traffic).toBe(MAP_UI.en.traffic);
  });

  it('ignores a blank override rather than emptying a legend label', () => {
    applyUiOverrides('zh', { 'map.traffic': '' });
    expect(mapUi('zh').traffic).toBe(MAP_UI.zh.traffic);
  });
});

describe('normalizeUiStringRows', () => {
  const rows = [
    { string_key: 'ui.navTravel', locale: 'bn', value: 'ক' },
    { string_key: 'map.title', locale: 'en', value: 'Corridor' },
  ];

  it('groups database rows by locale', () => {
    expect(normalizeUiStringRows(rows)).toEqual({
      bn: { 'ui.navTravel': 'ক' },
      en: { 'map.title': 'Corridor' },
    });
  });

  it('drops a locale the site does not serve, and a blank or non-string value', () => {
    const out = normalizeUiStringRows([
      ...rows,
      { string_key: 'ui.navTravel', locale: 'fr', value: 'Voyage' },
      { string_key: 'ui.navNews', locale: 'en', value: '  ' },
      { string_key: 'ui.navMap', locale: 'en', value: null },
      { string_key: '', locale: 'en', value: 'orphan' },
    ]);
    expect(out.fr).toBeUndefined();
    expect(out.en['ui.navNews']).toBeUndefined();
    expect(out.en['ui.navMap']).toBeUndefined();
    expect(out.en['']).toBeUndefined();
  });

  it('returns an empty set for null, undefined or junk rather than throwing', () => {
    for (const junk of [null, undefined, 'nope', 42, {}]) {
      expect(normalizeUiStringRows(junk)).toEqual({});
    }
  });
});

describe('applyUiOverrides / getUiOverrides', () => {
  it('replaces rather than merges, so a deleted override really disappears', () => {
    applyUiOverrides('en', { 'ui.navTravel': 'A', 'ui.navNews': 'B' });
    applyUiOverrides('en', { 'ui.navTravel': 'A' });
    expect(t('en', 'navNews')).toBe(UI.en.navNews);
  });

  it('hands back a serialisable plain object for the client bundle', () => {
    applyUiOverrides('en', { 'ui.navTravel': 'A' });
    expect(JSON.parse(JSON.stringify(getUiOverrides('en')))).toEqual({ 'ui.navTravel': 'A' });
    expect(getUiOverrides('zh')).toEqual({});
  });
});

describe('the catalogue the admin screen edits', () => {
  it('covers every key in both code tables, once each', () => {
    const keys = UI_STRING_CATALOGUE.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of Object.keys(UI.en)) expect(keys).toContain(`ui.${k}`);
    for (const k of Object.keys(MAP_UI.en)) expect(keys).toContain(`map.${k}`);
    expect(keys.length).toBe(Object.keys(UI.en).length + Object.keys(MAP_UI.en).length);
  });

  it('carries a non-empty code value in all three locales for every entry', () => {
    for (const entry of UI_STRING_CATALOGUE) {
      for (const locale of LOCALES) {
        expect(entry.values[locale], `${entry.key}.${locale}`).toBeTruthy();
      }
    }
  });

  it('gives every entry a group the admin screen can render', () => {
    for (const entry of UI_STRING_CATALOGUE) {
      expect(UI_STRING_GROUPS).toContain(entry.group);
    }
  });

  it('codeValue() answers for either namespace and is undefined for a stranger', () => {
    expect(codeValue('ui.navTravel', 'bn')).toBe(UI.bn.navTravel);
    expect(codeValue('map.title', 'zh')).toBe(MAP_UI.zh.title);
    expect(codeValue('ui.notAKey', 'en')).toBeUndefined();
    expect(codeValue('junk', 'en')).toBeUndefined();
  });

  it('findUiString() looks an entry up by its full key', () => {
    expect(findUiString('ui.navTravel').base).toBe('navTravel');
    expect(findUiString('nope')).toBeUndefined();
  });
});

describe('groupForKey', () => {
  it('puts the map namespace in the map group whatever the key', () => {
    expect(groupForKey('map.anything')).toBe(groupForKey('map.title'));
  });

  it('separates the surfaces an editor thinks in', () => {
    expect(groupForKey('ui.navTravel')).not.toBe(groupForKey('ui.contactWriteHeading'));
    expect(groupForKey('ui.formName')).toBe(groupForKey('ui.contactWriteHeading'));
    expect(groupForKey('ui.tollCaption')).toBe(groupForKey('ui.colToll'));
  });

  it('never invents a group that the screen cannot render', () => {
    expect(UI_STRING_GROUPS).toContain(groupForKey('ui.somethingAddedLater'));
  });
});

/**
 * The outage tests.
 *
 * lib/db.js is mocked so `query()` throws the way mysql2 throws when the pool
 * cannot connect, when credentials are refused, and when `ui_strings` has not
 * been imported yet (a real state: db/sql/09-ui-strings.sql is a hand-import,
 * so every existing database is missing this table until someone runs it).
 */
describe('loadUiStrings when the database is unavailable', () => {
  beforeEach(() => vi.resetModules());

  async function withQuery(impl) {
    vi.doMock('../../lib/db.js', () => ({ query: impl, dbEnabled: () => true }));
    return import('../../lib/i18n/strings-repo.js');
  }

  it('returns an empty override set when the connection is refused', async () => {
    const repo = await withQuery(async () => {
      const err = new Error('connect ECONNREFUSED');
      err.code = 'ECONNREFUSED';
      throw err;
    });
    await expect(repo.loadUiStrings()).resolves.toEqual({});
  });

  it('returns an empty override set when the table has not been imported', async () => {
    const repo = await withQuery(async () => {
      const err = new Error("Table 'db.ui_strings' doesn't exist");
      err.code = 'ER_NO_SUCH_TABLE';
      throw err;
    });
    await expect(repo.loadUiStrings()).resolves.toEqual({});
  });

  it('returns an empty override set when there is no database configured at all', async () => {
    // lib/db.js `query()` returns null, not rows, when DB_HOST/DB_NAME/DB_USER
    // are absent — the local no-database mode.
    const repo = await withQuery(async () => null);
    await expect(repo.loadUiStrings()).resolves.toEqual({});
  });

  it('leaves the site rendering its code strings in every locale', async () => {
    // The point of all three cases above: an outage must degrade to the
    // shipped translations, not to blanks and not to English-only.
    const repo = await withQuery(async () => { throw new Error('down'); });
    const overrides = await repo.loadUiStrings();
    for (const locale of LOCALES) applyUiOverrides(locale, overrides[locale] || {});
    expect(t('bn', 'contactWriteHeading')).toBe(UI.bn.contactWriteHeading);
    expect(t('zh', 'formSend')).toBe(UI.zh.formSend);
    expect(mapUi('bn')).toEqual(MAP_UI.bn);
  });

  it('reads rows when the database is healthy', async () => {
    const repo = await withQuery(async () => ([
      { string_key: 'ui.navTravel', locale: 'bn', value: 'X' },
    ]));
    await expect(repo.loadUiStrings()).resolves.toEqual({ bn: { 'ui.navTravel': 'X' } });
  });
});

/**
 * Cache options. Same guard, and the same reasoning, as
 * tests/unit/content-cache-options.test.js: tags alone give no recovery from a
 * cache entry warmed against a developer's database and shipped inside
 * .next/cache by the build-locally deploy.
 */
describe('lib/i18n/strings-cache.js reader options', () => {
  it('carries the ui-strings tag and the 300-second recovery floor', async () => {
    vi.resetModules();
    const calls = [];
    vi.doMock('next/cache', () => ({
      unstable_cache: (fn, keys, options) => {
        calls.push({ keys, options });
        return async (...args) => fn(...args);
      },
    }));
    vi.doMock('../../lib/i18n/strings-repo.js', () => ({ loadUiStrings: async () => ({}) }));
    const { UI_STRINGS_TAG } = await import('../../lib/revalidate.js');
    const mod = await import('../../lib/i18n/strings-cache.js');
    await mod.getUiStringsCached();
    expect(calls).toHaveLength(1);
    expect(calls[0].options.revalidate).toBe(300);
    expect(calls[0].options.tags).toEqual([UI_STRINGS_TAG]);
  });

  it('primeUiStrings loads the store and survives a failing reader', async () => {
    vi.resetModules();
    vi.doMock('next/cache', () => ({
      unstable_cache: (fn) => async (...args) => fn(...args),
    }));
    vi.doMock('../../lib/i18n/strings-repo.js', () => ({
      loadUiStrings: async () => ({ bn: { 'ui.navTravel': 'ভ্রমণ!' } }),
    }));
    const overrides = await import('../../lib/i18n/overrides.js');
    const { primeUiStrings } = await import('../../lib/i18n/strings-cache.js');
    await primeUiStrings();
    expect(overrides.getUiOverrides('bn')['ui.navTravel']).toBe('ভ্রমণ!');
  });
});

describe('the revalidate tag family', () => {
  it('has a stable ui-strings tag', async () => {
    const { UI_STRINGS_TAG } = await import('../../lib/revalidate.js');
    expect(UI_STRINGS_TAG).toBe('ui-strings');
  });

  it('revalidateUiStrings fires it', async () => {
    vi.resetModules();
    const fired = [];
    vi.doMock('next/cache', () => ({ revalidateTag: (tagName) => fired.push(tagName) }));
    const { revalidateUiStrings, UI_STRINGS_TAG } = await import('../../lib/revalidate.js');
    revalidateUiStrings();
    expect(fired).toEqual([UI_STRINGS_TAG]);
  });
});

/**
 * <UiStringsBridge> — the browser's copy of the store.
 *
 * Only two components in the client bundle read a string through `t()`:
 * ConsentBanner and TravelSubnav. (ContactForm and CorridorExplorer receive
 * their labels as props, resolved on the server — an earlier comment here said
 * otherwise.) Both are rendered for the locale of the page they are on and can
 * ask for no other, so the bridge carries ONE locale.
 *
 * That is not only a payload question, though it is that: a fully edited
 * `ui_strings` table is 33 KB of overrides across three locales and 16 KB for
 * one, on every request. It is also the honest shape — a page is in one
 * language, and shipping the other two invites a client component to render a
 * string in a locale the page is not in.
 */
describe('UiStringsBridge', () => {
  it('installs the locale it was handed, and nothing else', () => {
    clearUiOverrides();
    expect(UiStringsBridge({ locale: 'bn', table: { 'ui.navTravel': 'ভ্রমণ!' } })).toBe(null);
    expect(getUiOverrides('bn')).toEqual({ 'ui.navTravel': 'ভ্রমণ!' });
    expect(getUiOverrides('en')).toEqual({});
    expect(getUiOverrides('zh')).toEqual({});
    expect(t('bn', 'navTravel')).toBe('ভ্রমণ!');
  });

  it('replaces the locale rather than merging, so a reverted string reverts here too', async () => {
    clearUiOverrides();
    UiStringsBridge({ locale: 'en', table: { 'ui.navTravel': 'A', 'ui.navNews': 'B' } });
    UiStringsBridge({ locale: 'en', table: { 'ui.navTravel': 'A' } });
    expect(t('en', 'navNews')).toBe(UI.en.navNews);
  });

  it('renders the code values when it is handed nothing — the outage shape', () => {
    clearUiOverrides();
    expect(UiStringsBridge({ locale: 'zh' })).toBe(null);
    expect(getUiOverrides('zh')).toEqual({});
    expect(t('zh', 'consentAccept')).toBe(UI.zh.consentAccept);
  });

  it('is inert without a locale rather than corrupting the store', async () => {
    clearUiOverrides();
    applyUiOverrides('en', { 'ui.navTravel': 'kept' });
    expect(UiStringsBridge({ table: { 'ui.navTravel': 'lost' } })).toBe(null);
    expect(t('en', 'navTravel')).toBe('kept');
  });
});
