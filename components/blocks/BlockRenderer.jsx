import { getBlock } from '../../lib/blocks/registry.js';
import { resolveTranslation } from '../../lib/content/resolve.js';
import { isPlainObject } from '../../lib/json.js';
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
 */
export default function BlockRenderer({ blocks = [], locale }) {
  return (
    <>
      {blocks.map((block) => {
        const def = getBlock(block.type);
        if (!def) return null;
        const resolved = resolveTranslation(block.translations, locale);
        if (!resolved) return null;
        if (!isPlainObject(resolved.data)) return null;
        const Component = def.Component;
        return <Component key={block.id} data={resolved.data} locale={resolved.locale} />;
      })}
    </>
  );
}
