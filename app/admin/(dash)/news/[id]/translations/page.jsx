import { notFound } from 'next/navigation';
import Link from 'next/link';
import { assertCan } from '../../../../../../lib/auth/assert-can';
import { LOCALES, DEFAULT_LOCALE, LOCALE_LABELS } from '../../../../../../lib/i18n/locales';
import { getNewsPost } from '../../../../../../lib/news';
import { getNewsTranslations } from '../../../../../../lib/newsroom/admin';
import { saveNewsTranslationAction, deleteNewsTranslationAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * Translating one news article into Bangla and Chinese.
 *
 * The article's English lives on `news_updates` and is edited on the article
 * form; this screen only edits the other locales. Two places to edit the same
 * English text would drift the first time someone used the wrong one.
 *
 * The English is shown beside each field rather than in a separate tab, because
 * a translator working from memory of a page they opened a minute ago is how a
 * paragraph ends up translated twice and a paragraph ends up missed.
 */
export default async function NewsTranslations({ params }) {
  await assertCan('translate');
  const { id } = await params;

  const post = await getNewsPost(id);
  if (!post) notFound();

  const rows = await getNewsTranslations(post.id);
  const byLocale = new Map(rows.map((r) => [r.locale, r]));
  const targets = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <p className="text-sm">
          <Link href="/admin/news" className="text-blue-700 underline">All news</Link>
          {' · '}
          <Link href={`/admin/news/${post.id}`} className="text-blue-700 underline">Edit the article</Link>
        </p>
        <h1 className="text-2xl font-bold text-blue-900">Translations</h1>
        <p className="text-gray-600">{post.title}</p>
        <p className="text-sm text-gray-500">
          Until a translation is published, readers on that language see this article in
          English, with a note saying so.
        </p>
      </header>

      {targets.map((locale) => {
        const row = byLocale.get(locale);
        const status = row ? row.status : 'missing';
        return (
          <section key={locale} className="border rounded p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{LOCALE_LABELS[locale]}</h2>
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                  status === 'published'
                    ? 'bg-green-100 text-green-900'
                    : status === 'draft'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {status === 'missing' ? 'Not translated' : status}
              </span>
            </div>

            <form action={saveNewsTranslationAction} className="space-y-4">
              <input type="hidden" name="newsId" value={post.id} />
              <input type="hidden" name="locale" value={locale} />

              <Field
                label="Title" name="title" english={post.title}
                defaultValue={row ? row.title : ''}
              />
              <Field
                label="Excerpt" name="excerpt" english={post.excerpt} textarea rows={3}
                defaultValue={row ? row.excerpt : ''}
              />
              <Field
                label="Body" name="body" english={post.body} textarea rows={10} mono
                defaultValue={row ? row.body || '' : ''}
              />

              <div className="flex flex-wrap gap-2">
                <button type="submit" name="status" value="draft" className="px-4 py-2 border rounded">
                  Save draft
                </button>
                <button type="submit" name="status" value="published" className="px-4 py-2 rounded bg-black text-white">
                  Publish
                </button>
              </div>
            </form>

            {row ? (
              <form action={deleteNewsTranslationAction}>
                <input type="hidden" name="newsId" value={post.id} />
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="text-sm text-red-700 underline">
                  Remove this translation (readers fall back to English)
                </button>
              </form>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

/** A translation field with the English it translates shown directly above it. */
function Field({ label, name, english, defaultValue, textarea, rows = 3, mono }) {
  const id = `t-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
      {english ? (
        <p className={`text-sm text-gray-600 bg-gray-50 border rounded p-2 whitespace-pre-wrap ${mono ? 'font-mono text-xs' : ''}`}>
          {english}
        </p>
      ) : (
        <p className="text-sm text-gray-400">The English article has nothing here.</p>
      )}
      {textarea ? (
        <textarea
          id={id} name={name} rows={rows} defaultValue={defaultValue}
          className={`w-full border rounded px-3 py-2 ${mono ? 'font-mono text-sm' : ''}`}
        />
      ) : (
        <input
          id={id} name={name} type="text" defaultValue={defaultValue}
          className="w-full border rounded px-3 py-2"
        />
      )}
    </div>
  );
}
