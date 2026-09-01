import Link from 'next/link';
import { LOCALE_LABELS } from '../../../../lib/i18n/locales';
import { listPages, getPageBlocks } from '../../../../lib/content/pages';
import { summarizeTranslations } from '../../../../lib/content/summary';
import { assertCan } from '../../../../lib/auth/assert-can';

export const dynamic = 'force-dynamic';

export default async function TranslationDashboard() {
  await assertCan('translate');

  const pages = await listPages();
  const withBlocks = await Promise.all(
    pages.map(async (p) => ({ ...p, blocks: await getPageBlocks(p.id) }))
  );
  const rows = summarizeTranslations(withBlocks);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Translation status</h1>
        <p className="text-sm text-gray-500">
          Blocks not yet published in a language fall back to English on the live site.
        </p>
      </header>

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
    </div>
  );
}
