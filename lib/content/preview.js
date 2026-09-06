/**
 * Draft preview support.
 *
 * The preview route (`/{locale}/preview/{pageId}`) renders through exactly the
 * same components as the public page — `BlockRenderer` and
 * `resolveTranslation`. Building a second renderer that "also shows drafts"
 * would guarantee the preview and the live page drift apart, which is the one
 * failure a preview exists to prevent.
 *
 * So the renderer learns nothing about previewing. Instead the preview route
 * runs the rows from `getPageBlocks()` through this function first, which
 * promotes each `draft` translation to `published` for that single render.
 * Everything downstream — fallback to English, the unusable-data guard, the
 * per-block components — is byte-for-byte the code the public page runs.
 *
 * `missing` is deliberately NOT promoted: it means no row was ever written for
 * that locale, so promoting it would hand `resolveTranslation` an empty object
 * to render instead of letting the English fallback do its job.
 *
 * Returns new objects; the caller's rows are never mutated.
 */
export function withDraftTranslations(blocks) {
  return (blocks || []).map((block) => ({
    ...block,
    translations: (block.translations || []).map((t) =>
      (t.status === 'draft' ? { ...t, status: 'published' } : t)
    ),
  }));
}
