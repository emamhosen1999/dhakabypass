import Link from 'next/link';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { LOCALE_LABELS } from '../../../../lib/i18n/locales';
import { translationStatus } from '../../../../lib/admin/translation-status';
import { AdminPage, NoAccess } from '../../../../components/admin/ui';

export const dynamic = 'force-dynamic';

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 100);

/**
 * Translation status across every kind of content (audit T1): what a
 * translator still has to do in Bangla and Chinese, and where to do it.
 * Records without a translation fall back to English on the public site.
 */
export default async function TranslationStatusPage() {
  const session = await auth();
  if (!can(session?.user?.role, 'translate')) return <NoAccess what="translation status" />;
  const rows = await translationStatus();
  const todo = rows.reduce((n, r) => n + (r.langs.bn?.missing || 0) + (r.langs.zh?.missing || 0) + (r.langs.bn?.draft || 0) + (r.langs.zh?.draft || 0), 0);

  return (
    <AdminPage
      title="Translation status"
      intro={(
        <p>
          Everything on the site that is written in three languages. Where a record has no Bangla or Chinese text,
          readers of that language see the English. {todo ? `${todo} items still need a translator.` : 'Everything is translated.'}
        </p>
      )}
      width="max-w-5xl"
    >
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">Content</th>
              <th className="px-4 py-2 text-right">Records</th>
              <th className="px-4 py-2">{LOCALE_LABELS.bn}</th>
              <th className="px-4 py-2">{LOCALE_LABELS.zh}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  <Link href={r.href} className="underline text-blue-900">{r.label}</Link>
                </th>
                <td className="px-4 py-3 text-right tabular-nums">{r.error ? '—' : r.total}</td>
                {['bn', 'zh'].map((l) => {
                  const s = r.langs[l];
                  if (r.error || !s) return <td key={l} className="px-4 py-3 text-gray-500">Could not be read</td>;
                  const done = pct(s.published, r.total);
                  return (
                    <td key={l} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded bg-gray-200 overflow-hidden" aria-hidden="true">
                          <div className={`h-full ${done === 100 ? 'bg-green-600' : 'bg-amber-500'}`} style={{ width: `${done}%` }} />
                        </div>
                        <span className="tabular-nums">{done}%</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {s.missing ? `${s.missing} missing` : null}
                        {s.missing && s.draft ? ' · ' : null}
                        {s.draft ? `${s.draft} draft` : null}
                        {!s.missing && !s.draft ? 'Complete' : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-600">
        Place names (interchanges, segments, roads) are translated only from names DBEDC or the Roads and Highways
        Department publish; the site does not invent a Bangla or Chinese form of a place name.
      </p>
    </AdminPage>
  );
}
