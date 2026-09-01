# P0+P1 — Carried Findings and Preconditions for P2

**Date:** 2026-09-01
**Phase:** P0+P1 (foundations & design system) — complete, reviewed, merged
**Plan:** `docs/superpowers/plans/2026-08-31-dhakabypass-foundations-design-system.md`

This records what the P0+P1 review process deliberately deferred. It exists because
the working notes it came from were scratch, and a deferred-findings list nobody can
find later is a silent discard.

Every item below was found by review, triaged, and consciously left. None is a
regression, and the phase shipped with 142 unit/DB tests and 31 end-to-end tests
passing, a clean build, and the legacy site untouched.

---

## 1. Hard preconditions — must be handled by the task that touches the area

These are not backlog items. Each one is a trap laid for a specific piece of future
work, and the task brief that does that work must carry it.

| Precondition | Owning work |
|---|---|
| **`getPageBlocksCached` keys on `pageId` but tags on `slug`.** Rename a page's slug and the cached blocks keep the OLD slug's tag, so `revalidatePage(newSlug)` will not invalidate them — the public page serves stale blocks indefinitely. There is no rename path today (`createPage` only), which is the only reason this is dormant. | Whichever task adds slug rename |
| **`/en` and `/en/home` both render the home page** with no canonical link, i.e. duplicate content. | Must land before any sitemap / robots / structured-data work, and before cutover |
| **The build bakes in the build machine's database.** `app/[locale]/page.jsx` is SSG, and the deploy model is build-locally-then-upload. If the build machine has no `DB_*` env, `getPageBySlug` returns `null` and "No home page has been created yet." ships as static HTML that nothing invalidates until an admin edit fires `revalidateTag`. | Cutover / deploy checklist |
| **Production is MariaDB, not MySQL.** It implements `JSON` as `LONGTEXT` + `CHECK(JSON_VALID(...))`, and a non-strict `sql_mode` is the likely default — which silently coerces out-of-range `ENUM` writes to `''` instead of erroring. Verify `sql_mode` on the host. | Deploy |
| **Migration ordering.** The credentials provider reads `users`. Both `npm run db:setup:v2` and `npm run db:migrate:users` must run against production **before** this code is served, or password login fails closed and the admin is locked out. | Deploy |
| **`lib/content.js` (file) vs `lib/content/` (directory)** coexist and resolve correctly today because webpack tries the file first. Deleting `lib/content.js` at cutover makes ~17 legacy imports resolve to a directory with no `index.js`. That is a loud build error, not a silent wrong import — but it must be done deliberately. | Cutover |
| **Every primary nav link 404s.** `SiteHeaderV2` links to `/{locale}/travel\|project\|impact\|about\|news\|contact`; only `home` is seeded. Expected for P0/P1 — the pages are P2 — but the e2e suite asserts nav *text* only, never that a link resolves. | P2, plus one e2e test |

## 2. Open decision

**The new admin is unreachable and the media pipeline has no consumer.**
`/admin/pages-v2` and `/admin/translations` are linked from nowhere; the admin nav
lives in `app/admin/(dash)/layout.jsx`, a legacy file the boundary rule forbade
touching. `app/admin/api/media/route.js` has no caller, there is no media library
screen, and `setMediaAlt` has zero callers.

This is a plan gap, not an implementation defect — the plan never specified a media UI
or a nav entry. The delivered state is an admin that works only if you type URLs, and
an upload pipeline that was security-hardened across two review rounds and wired to
nothing. It needs a deliberate decision: fold into P2, or a small addendum now.

Related: `registry.js` declares an `image` field type but `BlockFields.jsx` has no
`image` branch, so such a field renders as a plain text input. That is the seam the
missing media library was meant to fill.

## 3. Deferred — safe to leave

**Correctness / robustness**
- `menu_items.parent_id` has no foreign key, so deleting a parent orphans children. `menus`/`menu_items` have no reader yet. (The equivalent hazard on `pages.parent_id` **was** fixed, via `deletePageIfChildless` with a locking read.)
- `blocks.status` is written by its schema default and read by nothing — a dead column. While it exists, `duplicateBlock` not copying it stays theoretically live.
- `setMediaAlt` is a read-modify-write across two untransacted queries; two concurrent saves for different locales lose one. It has no callers. This is the one unprincipled gap in an otherwise consistent transaction split.
- `block_translations.updated_by` and `revisions.created_by` have no FK to `users(id)`.
- `migrate-users.mjs` row-count arithmetic assumes no concurrent writes — affects a log line only.
- SVG uploads are not sanitised. `Content-Disposition: attachment`, `nosniff` and `default-src 'none'; sandbox` close the execution path. Re-open only if an inline-SVG feature appears.
- The uploads traversal guard does not resolve symlinks; a symlink inside `MEDIA_ROOT` pointing out would be followed. Only exploitable with write access to the upload directory. `fs.realpath` before the prefix check closes it.
- `public/uploads/` (legacy writer) and `var/uploads/` (new writer) share the `/uploads/*` URL namespace with no shared uniqueness check. Unreachable in practice because the legacy uploader appends a timestamp.

**Error handling**
- Sanitisation covers write paths but not reads: `listPages`, `getPageBlocks`, `listMedia` can let a driver error escape. Next redacts these in production builds, so the real cost is UX — a blank error page instead of a friendly message.

**Tests**
- Cache and tag-invalidation behaviour is untested; only the tag-name helpers are.
- The `jwt` callback composition is not directly unit-tested (`auth.js` cannot be imported cleanly under Vitest); only `resolveUserRole` is tested in isolation.
- `LOCALE_LABELS` values are not pinned by any test; `LOCALES` is a mutable array despite being documented `readonly`.
- The schema idempotency test asserts only "does not throw", not that the schema is unchanged after a second run.
- `summarizeTranslations` coverage omits: absent `blocks` key, `translations: undefined`, an explicit `'missing'` status, duplicate-locale rows, and `null` input. All traced correct by hand.

**Accessibility / polish**
- The theme toggle's `role="group"` + `aria-pressed` pattern deserves a screen-reader pass in the planned WCAG audit.
- A block field literally named `__proto__` or `constructor` would misbehave in `defaultBlockData`/`validateBlockData`. Theoretical while field names come from code modules only — do not introduce a path where admin input becomes a field name.

## 4. Process note carried into P2

Nearly every Important finding in the final whole-branch review was an **asymmetry
between two files written days apart** — one call site guarded, its sibling not
(`type` vs `status`, `addBlockAction` vs `saveTranslationAction`, the catch-all route
vs the home route, `can()` vs `extensionForMime`).

Per-task review cannot see these by construction. Adding one checklist item to P2's
briefs would remove most of the category:

> When you add a guard, grep for every sibling call site of the same input and guard
> it too.
