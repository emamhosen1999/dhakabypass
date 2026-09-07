import Link from 'next/link';
import { LOCALES, LOCALE_LABELS } from '../../../../lib/i18n/locales';
import { listPages, getPageBlocks } from '../../../../lib/content/pages';
import { summarizeTranslations } from '../../../../lib/content/summary';
import { assertCan } from '../../../../lib/auth/assert-can';
import { UI_STRING_CATALOGUE } from '../../../../lib/i18n/catalogue';
import { UI_STRING_GROUPS } from '../../../../lib/i18n/groups';
import { listUiStringRows } from '../../../../lib/i18n/strings-repo';
import { normalizeUiStringRows } from '../../../../lib/i18n/overrides';
import { saveUiStringAction, resetUiStringAction } from './actions';

export const dynamic = 'force-dynamic';

const BASE = '/admin/translations';

/** Long copy needs a box you can see the whole of; a nav label does not. */
function rowsFor(entry) {
  const longest = Math.max(...LOCALES.map((l) => (entry.values[l] || '').length));
  if (longest > 160) return 4;
  if (longest > 60) return 2;
  return 1;
}

function matches(entry, needle) {
  if (!needle) return true;
  const haystack = [entry.key, ...LOCALES.map((l) => entry.values[l] || '')].join(' ').toLowerCase();
  return haystack.includes(needle);
}

/**
 * The UI-string editor (W1.6) and, below it, the block translation coverage
 * table this screen used to be on its own.
 *
 * The 182 keys are shown one group at a time. All of them at once is 546 text
 * boxes in one document — slow to render, impossible to scan, and a form that
 * large is a form nobody finishes. Search cuts across every group for when the
 * editor knows the wording but not where it lives.
 *
 * The screen renders the CODE CATALOGUE and overlays the database rows, never
 * the other way round. That ordering is the whole design: a string is editable
 * because the code defines it, so a missing table, an empty table and a
 * half-imported one all show the same complete list of strings — with a
 * warning — rather than a blank page.
 */
export default async function TranslationDashboard({ searchParams }) {
  await assertCan('translate');

  const params = (await searchParams) || {};
  const query = String(params.q || '').trim().toLowerCase();
  const group = UI_STRING_GROUPS.includes(params.group) ? params.group : UI_STRING_GROUPS[0];

  let overrides = {};
  let readFailed = false;
  try {
    overrides = normalizeUiStringRows(await listUiStringRows());
  } catch {
    // Almost always "the table is not there yet" — this file is a hand-import
    // through phpMyAdmin (db/sql/README.md), so it is the normal state of a
    // database that has just taken this release.
    readFailed = true;
  }

  const overriddenCount = LOCALES.reduce((n, l) => n + Object.keys(overrides[l] || {}).length, 0);

  const visible = query
    ? UI_STRING_CATALOGUE.filter((e) => matches(e, query))
    : UI_STRING_CATALOGUE.filter((e) => e.group === group);

  const pages = await listPages();
  const withBlocks = await Promise.all(
    pages.map(async (p) => ({ ...p, blocks: await getPageBlocks(p.id) }))
  );
  const rows = summarizeTranslations(withBlocks);

  return (
    <div className="p-6 space-y-10 max-w-5xl">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-blue-900">Words on the site</h1>
        <p className="text-gray-600">
          Headings, buttons, form labels, error messages, the map legend and the navigation —
          every fixed piece of wording on the public site, in all three languages.
        </p>
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          <strong>Leaving a box empty restores the built-in wording.</strong> The site never shows a
          blank label: anything not set here falls back to the wording that ships with the site, so
          the pages keep working even if the database cannot be reached.
        </p>
        {readFailed ? (
          <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded p-3">
            <strong>These strings cannot be stored yet.</strong> The <code>ui_strings</code> table is
            missing or unreadable, so the site is showing its built-in wording and saving here will
            fail. Import <code>db/sql/09-ui-strings.sql</code> through phpMyAdmin, then reload.
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            {overriddenCount === 0
              ? `All ${UI_STRING_CATALOGUE.length} strings are using the built-in wording.`
              : `${overriddenCount} of ${UI_STRING_CATALOGUE.length * LOCALES.length} translations have been changed here.`}
          </p>
        )}
      </header>

      <section className="space-y-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="q" className="block text-sm font-semibold">Search</label>
            <input
              id="q" name="q" defaultValue={query} placeholder="a word, or a key like navTravel"
              className="border rounded px-3 py-2 w-72"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded bg-blue-900 text-white text-sm font-semibold">
            Search
          </button>
          {query ? (
            <Link href={BASE} className="text-sm underline text-gray-600">Clear</Link>
          ) : null}
        </form>

        {query ? null : (
          <nav className="flex flex-wrap gap-2">
            {UI_STRING_GROUPS.map((g) => (
              <Link
                key={g}
                href={`${BASE}?group=${encodeURIComponent(g)}`}
                className={`px-3 py-1.5 rounded text-sm font-semibold ${
                  g === group ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {g}
              </Link>
            ))}
          </nav>
        )}

        <h2 className="text-lg font-bold">
          {query ? `${visible.length} matching ${visible.length === 1 ? 'string' : 'strings'}` : group}
        </h2>

        {visible.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing matched. Try a shorter word.</p>
        ) : null}

        <ul className="space-y-4">
          {visible.map((entry) => {
            const custom = LOCALES.some((l) => overrides[l]?.[entry.key]);
            return (
              <li key={entry.key} className="border rounded p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <code className="font-mono text-xs text-gray-500 break-all">{entry.key}</code>
                  <span className={`text-xs font-semibold rounded px-2 py-0.5 ${
                    custom ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-600'}`}>
                    {custom ? 'changed here' : 'built-in wording'}
                  </span>
                </div>

                <form action={saveUiStringAction} className="space-y-3">
                  <input type="hidden" name="key" value={entry.key} />
                  <div className="grid gap-3 md:grid-cols-3">
                    {LOCALES.map((locale) => {
                      const stored = overrides[locale]?.[entry.key] || '';
                      const id = `${entry.key}-${locale}`;
                      return (
                        <div key={locale} className="space-y-1">
                          <label htmlFor={id} className="block text-sm font-semibold">
                            {LOCALE_LABELS[locale]}
                            {stored ? null : (
                              <span className="ml-2 font-normal text-xs text-gray-500">built-in</span>
                            )}
                          </label>
                          <textarea
                            id={id}
                            name={`value_${locale}`}
                            rows={rowsFor(entry)}
                            defaultValue={stored}
                            placeholder={entry.values[locale] || ''}
                            className="w-full border rounded px-3 py-2 text-sm"
                          />
                          <p className="text-xs text-gray-500 break-words">
                            Built in: {entry.values[locale] || '—'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="submit" className="px-4 py-2 rounded bg-blue-900 text-white text-sm font-semibold">
                      Save
                    </button>
                  </div>
                </form>

                {custom ? (
                  <form action={resetUiStringAction}>
                    <input type="hidden" name="key" value={entry.key} />
                    <button type="submit" className="text-sm text-red-700 underline">
                      Use the built-in wording again
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Page content still to translate</h2>
        <p className="text-sm text-gray-500">
          Blocks not yet published in a language fall back to English on the live site.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Page</th><th>Blocks</th>
              <th>{LOCALE_LABELS.bn}</th><th>{LOCALE_LABELS.zh}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pageId} className="border-b">
                <td className="py-2">
                  <Link href={`/admin/pages-v2/${r.pageId}`} className="underline">{r.title || r.slug}</Link>
                </td>
                <td>{r.total}</td>
                <td>{r.missing.bn === 0 ? 'Complete' : `${r.missing.bn} missing`}</td>
                <td>{r.missing.zh === 0 ? 'Complete' : `${r.missing.zh} missing`}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-gray-500">No pages yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
