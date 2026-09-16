import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '../../../../../auth';
import { can } from '../../../../../lib/auth/roles';
import { LOCALES, LOCALE_LABELS } from '../../../../../lib/i18n/locales';
import { allBlocks, getBlock, defaultBlockData } from '../../../../../lib/blocks/registry';
import '../../../../../lib/blocks/index';
import { listPages, getPageBlocks } from '../../../../../lib/content/pages';
import { listRevisions } from '../../../../../lib/content/revisions';
import { getPageForAdmin, isProtectedPage, SEO_TITLE_MAX, SEO_DESCRIPTION_MAX } from '../../../../../lib/content/page-settings';
import { PRESENTATION, PRESENTATION_KEYS, presentationOf } from '../../../../../lib/blocks/presentation';
import { translationStatus } from '../../../../../lib/content/resolve';
import { stampOf } from '../../../../../lib/admin/history';
import BlockFields from '../../../../../components/admin/BlockFields';
import { resolveFieldOptions } from '../../../../../lib/blocks/field-options.js';
import BlockSortableList from '../../../../../components/admin/BlockSortableList';
import PreviewPane from '../../../../../components/admin/PreviewPane';
import ImageField from '../../../../../components/admin/ImageField';
import CountedField from '../../../../../components/admin/CountedField';
import { AdminPage, Button, NoAccess, HistoryLink, formatWhen } from '../../../../../components/admin/ui';
import {
  addBlockAction, deleteBlockAction, duplicateBlockAction, reorderBlocksAction, saveTranslationAction,
  restoreRevisionAction, saveBlockSettingsAction, discardDraftAction, unpublishTranslationAction,
} from './block-actions';
import { savePageSettingsAction } from '../actions';

export const dynamic = 'force-dynamic';

/** The first few text values of a version, tags stripped, for the list. */
function revisionPreview(data) {
  const out = [];
  for (const [k, v] of Object.entries(data || {})) {
    if (typeof v !== 'string' || !v.trim()) continue;
    out.push(`${k}: ${v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)}`);
    if (out.length >= 3) break;
  }
  return out.join('\n') || '(no text fields)';
}

const STATE = {
  published: { text: 'Published', cls: 'bg-green-100 text-green-800' },
  changes: { text: 'Published · unpublished changes', cls: 'bg-amber-100 text-amber-900' },
  draft: { text: 'Not published', cls: 'bg-gray-200 text-gray-800' },
  missing: { text: 'Not translated', cls: 'bg-red-50 text-red-800' },
};

export default async function BlockEditor({ params, searchParams }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!can(role, 'translate')) return <NoAccess what="the page editor" />;
  const canEditBlocks = can(role, 'edit_blocks');
  const canManagePages = can(role, 'manage_pages');

  const { id } = await params;
  const sp = (await searchParams) || {};
  const locale = LOCALES.includes(sp.locale) ? sp.locale : 'en';
  const pageId = Number(id);

  const pages = await listPages();
  const page = pages.find((p) => p.id === pageId);
  if (!page) notFound();
  const [blocks, settings] = await Promise.all([getPageBlocks(pageId), getPageForAdmin(pageId)]);
  const locked = isProtectedPage(page.slug);

  // Previous versions per block, for this locale (W1.13).
  const history = new Map();
  for (const block of blocks) {
    try { history.set(block.id, await listRevisions(block.id, locale, 10)); } catch { history.set(block.id, []); }
  }

  // Per-language progress for the tabs (audit T2).
  const progress = Object.fromEntries(LOCALES.map((l) => [l, blocks.filter((b) => translationStatus(b.translations, l) === 'published').length]));

  // Fields whose options are records — the section menu's list of menus — are
  // resolved once per block type here, because the map below is not async
  // (W8N.3).
  const fieldsByType = new Map();
  for (const type of new Set(blocks.map((b) => b.type))) {
    const def = getBlock(type);
    if (def) fieldsByType.set(type, await resolveFieldOptions(def.fields));
  }

  const items = blocks
    .map((block, index) => {
      const def = getBlock(block.type);
      if (!def) return null;
      const revisions = history.get(block.id) || [];
      const row = block.translations.find((t) => t.locale === locale);
      const english = block.translations.find((t) => t.locale === 'en');
      const status = translationStatus(block.translations, locale);
      const state = row?.draft != null && status === 'published' ? 'changes' : status;
      const working = row?.draft ?? row?.data;
      const data = working ?? (locale === 'en' ? defaultBlockData(block.type) : english?.draft ?? english?.data ?? {});
      const position = index + 1;
      const recordLabel = `the ${def.label} block (position ${position})`;
      const hidden = (
        <>
          <input type="hidden" name="pageId" value={pageId} />
          <input type="hidden" name="slug" value={page.slug} />
          <input type="hidden" name="blockId" value={block.id} />
        </>
      );

      return {
        id: block.id,
        label: def.label,
        status: STATE[state]?.text || status,
        editor: (
          <div className="space-y-3" data-record-label={recordLabel}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATE[state]?.cls || 'bg-gray-100'}`}>{LOCALE_LABELS[locale]}: {STATE[state]?.text || status}</span>
              {row?.updatedAt ? <span className="text-xs text-gray-500">Last saved {formatWhen(row.updatedAt)}</span> : null}
              {canEditBlocks ? (
                <div className="ml-auto flex gap-2">
                  <form action={duplicateBlockAction}>
                    {hidden}
                    <Button variant="secondary" data-noconfirm="" data-pending="Duplicating…">Duplicate</Button>
                  </form>
                  <form action={deleteBlockAction}>
                    {hidden}
                    <Button
                      variant="danger"
                      data-confirm={`Delete ${recordLabel} in all ${block.translations.length} language${block.translations.length === 1 ? '' : 's'}?\n\nIt goes to the trash, where it can be restored with its text.`}
                    >
                      Delete
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>

            {locale !== 'en' && !english ? (
              <p className="text-xs text-amber-900 bg-amber-50 rounded p-2">This block has no English text yet; translate it once the English is written.</p>
            ) : null}
            {locale !== 'en' ? (
              <p className="text-xs text-gray-600">Until this language is published, {LOCALE_LABELS[locale]} readers see the English text of this block.</p>
            ) : null}

            {/* Keyed on the saved text: after a restore or a save the fields
                remount with the new values (audit F5). */}
            <form key={`${block.id}:${locale}:${stampOf(row?.updatedAt)}:${JSON.stringify(working ?? null).length}`} action={saveTranslationAction} className="space-y-3">
              {hidden}
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="type" value={block.type} />
              {row?.updatedAt ? <input type="hidden" name="_stamp" value={stampOf(row.updatedAt)} /> : null}
              <BlockFields fields={fieldsByType.get(block.type) || def.fields} data={data} source={locale !== 'en' ? (english?.data ?? null) : null} />
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="secondary" name="status" value="draft" data-noconfirm="" data-pending="Saving draft…">
                  Save draft
                </Button>
                <Button name="status" value="published" data-noconfirm="" data-pending="Publishing…">
                  {state === 'published' || state === 'changes' ? 'Publish changes' : 'Publish'}
                </Button>
                <span className="text-xs text-gray-500">
                  {state === 'published' || state === 'changes'
                    ? 'Save draft keeps the live text unchanged until you publish.'
                    : 'Not on the public page until you publish.'}
                </span>
              </div>
            </form>

            {state === 'changes' || state === 'published' ? (
              <div className="flex flex-wrap gap-3 text-sm">
                {state === 'changes' ? (
                  <form action={discardDraftAction}>
                    {hidden}
                    <input type="hidden" name="locale" value={locale} />
                    <Button variant="quiet" data-confirm={`Discard the unpublished changes to ${recordLabel} (${LOCALE_LABELS[locale]})?\n\nThe live text stays as it is. The discarded draft is kept under Previous versions.`} data-flash="Draft discarded.">
                      Discard draft
                    </Button>
                  </form>
                ) : null}
                <form action={unpublishTranslationAction}>
                  {hidden}
                  <input type="hidden" name="locale" value={locale} />
                  <Button
                    variant="quiet"
                    data-confirm={locale === 'en'
                      ? `Unpublish ${recordLabel}?\n\nIt disappears from the public page in every language that falls back to English.`
                      : `Unpublish the ${LOCALE_LABELS[locale]} text of ${recordLabel}?\n\n${LOCALE_LABELS[locale]} readers will see the English text instead.`}
                    data-flash="Unpublished."
                  >
                    Unpublish
                  </Button>
                </form>
              </div>
            ) : null}

            {canEditBlocks ? (
              <details className="text-sm bg-gray-50 rounded p-3">
                <summary className="cursor-pointer">Presentation: background, spacing, width, alignment (all languages)</summary>
                <form
                  key={`${block.id}:${JSON.stringify(block.settings || {})}`}
                  action={saveBlockSettingsAction} className="mt-2 flex flex-wrap items-end gap-3"
                >
                  {hidden}
                  {PRESENTATION_KEYS.map((key) => (
                    <label key={key} className="text-xs font-semibold text-gray-700">
                      {PRESENTATION[key].label}
                      <select name={`p.${key}`} defaultValue={presentationOf(block.settings)[key]} className="block mt-1 border rounded px-2 py-1 text-sm font-normal">
                        {PRESENTATION[key].options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                  ))}
                  <Button variant="secondary" data-noconfirm="" data-flash="Presentation applied.">Apply</Button>
                </form>
              </details>
            ) : null}

            {revisions.length > 0 ? (
              <details className="text-sm bg-gray-50 rounded p-3">
                <summary className="cursor-pointer">
                  Previous versions ({revisions.length}): restoring one puts it into the draft; the current text is kept as a version too
                </summary>
                <ul className="mt-2 divide-y">
                  {revisions.map((r) => (
                    <li key={r.id} className="py-2 flex flex-wrap items-start gap-3">
                      <div className="min-w-0 grow">
                        <div className="text-xs text-gray-500">
                          {formatWhen(r.createdAt)} · was {r.status}{r.by ? ` · ${r.by}` : ''}
                        </div>
                        <pre className="mt-1 whitespace-pre-wrap text-xs text-gray-700 max-h-24 overflow-hidden">{revisionPreview(r.data)}</pre>
                      </div>
                      <form action={restoreRevisionAction}>
                        <input type="hidden" name="pageId" value={pageId} />
                        <input type="hidden" name="slug" value={page.slug} />
                        <input type="hidden" name="revisionId" value={r.id} />
                        <Button
                          variant="secondary"
                          data-confirm={`Put the ${LOCALE_LABELS[locale]} text of ${recordLabel} back as it was on ${formatWhen(r.createdAt)}?\n\nIt goes into the draft; the public page changes only when you publish.`}
                          data-flash="Restored into the draft."
                          data-pending="Restoring…"
                        >
                          Restore
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {canEditBlocks ? (
              <form action={addBlockAction} className="flex flex-wrap gap-2 items-end border-t pt-3">
                <input type="hidden" name="pageId" value={pageId} />
                <input type="hidden" name="slug" value={page.slug} />
                <input type="hidden" name="after" value={block.id} />
                <label className="flex flex-col text-xs text-gray-600">
                  Add a block below this one
                  <BlockTypeSelect />
                </label>
                <Button variant="secondary" data-noconfirm="" data-pending="Adding…">Add below</Button>
              </form>
            ) : null}
          </div>
        ),
      };
    })
    .filter(Boolean);

  const pageStamp = stampOf(settings?.updated_at);
  const title = settings?.translations?.en?.title || page.slug;

  return (
    <AdminPage title={<>{title}</>}
      intro={(
        <>
          <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
                      {page.status === 'published' ? 'Page published' : 'Page is a draft: not on the public site'}
                    </span>
                    <HistoryLink type="page_settings" id={pageId} />
                    <Link href="/admin/pages-v2" className="text-sm underline text-blue-900">All pages</Link>
                  </div>
                  <p className="text-sm text-gray-500">
                    <code>/{page.slug}</code>
                    {settings?.updated_at ? <> · last changed {formatWhen(settings.updated_at)}{settings.updated_by ? ` by ${settings.updated_by}` : ''}</> : null}
                  </p>
                  <nav aria-label="Language" className="flex flex-wrap gap-2 pt-1">
                    {LOCALES.map((l) => (
                      <Link key={l} href={`?locale=${l}`} aria-current={l === locale ? 'page' : undefined}
                        className={`px-3 py-1 rounded text-sm ${l === locale ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {LOCALE_LABELS[l]} <span className="opacity-80">({progress[l]}/{blocks.length} published)</span>
                      </Link>
                    ))}
                  </nav>
        </>
      )}>

      {canManagePages && settings ? (
        <details className="bg-white border rounded-lg p-4" open={page.status !== 'published'}>
          <summary className="cursor-pointer font-semibold text-blue-900">Page settings: titles, search text, address, status</summary>
          <form key={pageStamp} action={savePageSettingsAction} className="mt-4 space-y-5" data-record-label={`the settings of "${title}"`}>
            <input type="hidden" name="id" value={pageId} />
            {pageStamp ? <input type="hidden" name="_stamp" value={pageStamp} /> : null}
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Address</span>
                <input name="slug" defaultValue={page.slug} readOnly={locked} className={`border rounded px-3 py-2 font-mono ${locked ? 'bg-gray-100' : ''}`} />
                <span className="text-xs text-gray-500">{locked ? 'This page’s address is fixed.' : 'Changing it adds a permanent redirect from the old address in every language.'}</span>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Parent page</span>
                <select name="parent_id" defaultValue={settings.parent_id ?? ''} className="border rounded px-3 py-2">
                  <option value="">None (top level)</option>
                  {pages.filter((p) => p.id !== pageId).map((p) => <option key={p.id} value={p.id}>{p.title || p.slug} (/{p.slug})</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Status</span>
                <select name="status" defaultValue={settings.status} disabled={locked} className="border rounded px-3 py-2">
                  <option value="draft">Draft: not on the public site</option>
                  <option value="published">Published</option>
                </select>
                {locked ? <input type="hidden" name="status" value="published" /> : null}
              </label>
            </div>
            <fieldset className="border rounded p-3">
              <legend className="px-1 text-sm font-semibold">Ownership and review</legend>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold">Owning department</span>
                  <input name="owner_department" defaultValue={settings.owner_department || ''} maxLength={120} className="border rounded px-3 py-2" />
                  <span className="text-xs text-gray-500">Who answers for the accuracy of this page.</span>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold">Last reviewed</span>
                  <input type="date" name="reviewed_at" defaultValue={settings.reviewed_at ? String(settings.reviewed_at).slice(0, 10) : ''} className="border rounded px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold">Review every (days)</span>
                  <input type="number" name="review_interval_days" min="1" max="3650" defaultValue={settings.review_interval_days ?? ''} className="border rounded px-3 py-2" />
                  <span className="text-xs text-gray-500">The dashboard lists pages whose review is due.</span>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3 mt-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold">Legal review</span>
                  <select name="legal_status" defaultValue={settings.legal_status || ''} className="border rounded px-3 py-2">
                    <option value="">Not needed</option>
                    <option value="review">Under review: the page shows a notice</option>
                    <option value="approved">Approved</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold">Approved by</span>
                  <input name="legal_approved_by" defaultValue={settings.legal_approved_by || ''} maxLength={191} className="border rounded px-3 py-2" placeholder="Name and role" />
                </label>
                <p className="text-xs text-gray-600 self-end">
                  {settings.legal_status === 'approved' && settings.legal_approved_at
                    ? `Approved ${String(settings.legal_approved_at).slice(0, 10)} by ${settings.legal_approved_by}.`
                    : 'Required when marking a page approved; the date is recorded automatically.'}
                </p>
              </div>
            </fieldset>
            {LOCALES.map((l) => {
              const t = settings.translations[l] || {};
              return (
                <fieldset key={l} className="border rounded p-3 space-y-3">
                  <legend className="px-1 text-sm font-semibold">{LOCALE_LABELS[l]}</legend>
                  <div className="grid gap-3 md:grid-cols-2">
                    <CountedField name={`title_${l}`} label="Page title" defaultValue={t.title || ''} max={255} required={l === 'en'} hint={l === 'en' ? '' : 'Empty uses the English title'} />
                    <CountedField name={`seo_title_${l}`} label="Search result title" defaultValue={t.seo_title || ''} soft={SEO_TITLE_MAX} max={255} hint="Empty uses the page title" />
                  </div>
                  <CountedField name={`seo_description_${l}`} label="Search result description" defaultValue={t.seo_description || ''} soft={SEO_DESCRIPTION_MAX} max={500} multiline />
                  <ImageField name={`og_image_${l}`} label="Sharing image (shown when the page is shared on social media)" value={t.og_image || ''} />
                </fieldset>
              );
            })}
            <Button data-noconfirm="" data-pending="Saving…">Save page settings</Button>
          </form>
        </details>
      ) : null}

      <div className="grid gap-8 items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,40rem)]">
        <div className="space-y-6 xl:order-first">
          {canEditBlocks ? (
            <form action={addBlockAction} className="flex flex-wrap gap-2 items-end bg-white border rounded-lg p-3">
              <input type="hidden" name="pageId" value={pageId} />
              <input type="hidden" name="slug" value={page.slug} />
              <label className="flex flex-col text-sm">
                Add a block at the end
                <BlockTypeSelect />
              </label>
              <Button data-noconfirm="" data-pending="Adding…">Add</Button>
              <span className="text-xs text-gray-500 basis-full">A new block is not on the public page until you publish it.</span>
            </form>
          ) : (
            <p className="text-sm text-gray-600 bg-gray-50 border rounded p-3">You can translate and publish text here. Adding, moving and deleting blocks is for editors.</p>
          )}

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
    </AdminPage>
  );
}

function BlockTypeSelect() {
  const blocks = [...allBlocks()].sort((a, b) => a.label.localeCompare(b.label));
  return (
    <select name="type" className="border rounded px-3 py-2 text-sm">
      {blocks.map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
    </select>
  );
}
