import { notFound } from 'next/navigation';
import { LOCALES, LOCALE_LABELS } from '../../../../../lib/i18n/locales';
import { allBlocks, getBlock, defaultBlockData } from '../../../../../lib/blocks/registry';
import '../../../../../lib/blocks/index';
import { listPages, getPageBlocks } from '../../../../../lib/content/pages';
import { translationStatus } from '../../../../../lib/content/resolve';
import BlockFields from '../../../../../components/admin/BlockFields';
import BlockSortableList from '../../../../../components/admin/BlockSortableList';
import PreviewPane from '../../../../../components/admin/PreviewPane';
import { assertCan } from '../../../../../lib/auth/assert-can';
import {
  addBlockAction, deleteBlockAction, duplicateBlockAction, reorderBlocksAction, saveTranslationAction,
} from './block-actions';

export const dynamic = 'force-dynamic';

export default async function BlockEditor({ params, searchParams }) {
  await assertCan('translate');
  const { id } = await params;
  const { locale = 'en' } = await searchParams;
  const pageId = Number(id);

  const page = (await listPages()).find((p) => p.id === pageId);
  if (!page) notFound();
  const blocks = await getPageBlocks(pageId);

  /**
   * Each block's editor is rendered here, on the server, and handed to the
   * client sortable list as a node. The forms below keep their own server
   * actions — the drag layer only reorders the wrappers around them, so
   * BlockFields and the save/publish path stay server-rendered and work
   * exactly as before.
   */
  const items = blocks
    .map((block) => {
      const def = getBlock(block.type);
      if (!def) return null;
      const row = block.translations.find((t) => t.locale === locale);
      const english = block.translations.find((t) => t.locale === 'en');
      const status = translationStatus(block.translations, locale);
      const data = row?.data ?? (locale === 'en' ? defaultBlockData(block.type) : english?.data ?? {});

      return {
        id: block.id,
        label: def.label,
        status,
        editor: (
          <>
            <div className="flex gap-2">
              <form action={duplicateBlockAction}>
                <input type="hidden" name="pageId" value={pageId} />
                <input type="hidden" name="slug" value={page.slug} />
                <input type="hidden" name="blockId" value={block.id} />
                <button type="submit" className="px-2 py-1 border rounded">Duplicate</button>
              </form>
              <form action={deleteBlockAction}>
                <input type="hidden" name="pageId" value={pageId} />
                <input type="hidden" name="slug" value={page.slug} />
                <input type="hidden" name="blockId" value={block.id} />
                <button type="submit" className="px-2 py-1 border rounded text-red-600">Delete</button>
              </form>
            </div>

            {locale !== 'en' && english ? (
              <details className="text-sm bg-gray-50 rounded p-3">
                <summary className="cursor-pointer">English source</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(english.data, null, 2)}</pre>
              </details>
            ) : null}

            <form action={saveTranslationAction} className="space-y-3">
              <input type="hidden" name="pageId" value={pageId} />
              <input type="hidden" name="slug" value={page.slug} />
              <input type="hidden" name="blockId" value={block.id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="type" value={block.type} />
              <BlockFields fields={def.fields} data={data} />
              <div className="flex gap-2">
                <button type="submit" name="status" value="draft" className="px-4 py-2 border rounded">
                  Save draft
                </button>
                <button type="submit" name="status" value="published" className="px-4 py-2 rounded bg-black text-white">
                  Publish
                </button>
              </div>
            </form>
          </>
        ),
      };
    })
    .filter(Boolean);

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{page.title || page.slug}</h1>
        <p className="text-sm text-gray-500"><code>/{page.slug}</code></p>
        <nav className="flex gap-2 pt-2">
          {LOCALES.map((l) => (
            <a key={l} href={`?locale=${l}`}
               className={`px-3 py-1 rounded text-sm ${l === locale ? 'bg-black text-white' : 'bg-gray-100'}`}>
              {LOCALE_LABELS[l]}
            </a>
          ))}
        </nav>
      </header>

      {/* The preview is the primary editing surface, so it sits beside the
          editor and sticks to the viewport rather than hiding below the fold.
          Below xl it stacks above the blocks — still visible without hunting. */}
      <div className="grid gap-8 items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,40rem)]">
        <div className="space-y-6 xl:order-first">
          <form action={addBlockAction} className="flex gap-2 items-end">
            <input type="hidden" name="pageId" value={pageId} />
            <input type="hidden" name="slug" value={page.slug} />
            <label className="flex flex-col text-sm">
              Add a block
              <select name="type" className="border rounded px-3 py-2">
                {allBlocks().map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
              </select>
            </label>
            <button type="submit" className="px-4 py-2 rounded bg-black text-white">Add</button>
          </form>

          <BlockSortableList
            pageId={pageId}
            slug={page.slug}
            items={items}
            reorderAction={reorderBlocksAction}
          />
        </div>

        <div className="xl:sticky xl:top-6">
          <PreviewPane
            pageId={pageId}
            locale={locale}
            locales={LOCALES}
            localeLabels={LOCALE_LABELS}
          />
        </div>
      </div>
    </div>
  );
}
