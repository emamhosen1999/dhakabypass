import { getBlock } from '../../lib/blocks/registry.js';
import { resolveTranslation } from '../../lib/content/resolve.js';
import { isPlainObject } from '../../lib/json.js';
import { presentationClasses } from '../../lib/blocks/presentation.js';
import '../../lib/blocks/index.js';

/**
 * Renders an ordered list of blocks for one locale.
 * A block with no publishable content in any locale is skipped entirely,
 * so a partly-translated page is short rather than broken.
 *
 * `block_translations.data` is `JSON NOT NULL`, which still admits the JSON
 * literal `null` (and a bare scalar, and an array): mysql2 hands those back as
 * JS `null` / a string / an array, and lib/content/pages.js passes them
 * straight through. Every renderer then reads `data.image`, `data.heading` or
 * `data.classes` on the first line, so one such row would throw and take
 * /en, /bn and /zh down together. The admin cannot write one, but the seed
 * scripts, the legacy import and hand-written SQL all can, and this project
 * uses all three routinely.
 *
 * So a block whose data is not the object every block type expects is skipped
 * exactly like an untranslated one — the same rule lib/media/repo.js's shape()
 * and lib/corridor/geometry.js's usable() already apply to their own rows: a
 * bad row degrades itself and never takes down the page rendering the rest.
 *
 * ---------------------------------------------------------------------------
 * WHY `searchParams` IS PASSED DOWN UNAWAITED
 * ---------------------------------------------------------------------------
 * INT.2's toll calculator is a real GET form: the visitor's journey is in the
 * query string and the FARE IS SERVER-RENDERED FROM IT, so a driver with no
 * JavaScript still gets an answer and the answer has a shareable address. That
 * needs the query string down here, in a block.
 *
 * It is handed on as the PROMISE the page received, never awaited here. In
 * Next 15 awaiting `searchParams` is what opts a route out of static
 * generation, so awaiting it in this dispatcher would make every block
 * document on the site render per request — for a block almost none of them
 * carry. Passed unawaited, the cost lands only where it is used: a page with a
 * toll calculator on it awaits and becomes dynamic; every other page never
 * touches the promise and stays prerendered exactly as before.
 *
 * `blockId` is passed for DOM identity — a <label for> needs an id that is
 * unique on the page, and two of the same block type on one page must not
 * collide.
 */
export default function BlockRenderer({ blocks = [], locale, searchParams }) {
  return (
    <>
      {blocks.map((block) => {
        const def = getBlock(block.type);
        if (!def) return null;
        const resolved = resolveTranslation(block.translations, locale);
        if (!resolved) return null;
        if (!isPlainObject(resolved.data)) return null;
        const Component = def.Component;
        const element = (
          <Component
            key={block.id}
            data={resolved.data}
            locale={resolved.locale}
            blockId={block.id}
            searchParams={searchParams}
          />
        );
        // Presentation settings (W1.15) — background, spacing, width,
        // alignment — are per BLOCK, not per language, and live in
        // blocks.settings. A block with none renders exactly as before: no
        // wrapper at all, so nothing about the existing pages changes.
        const cls = presentationClasses(block.settings);
        return cls ? <div key={block.id} className={`db-pwrap ${cls}`}>{element}</div> : element;
      })}
    </>
  );
}
