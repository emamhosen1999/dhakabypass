import { getBlock } from '../../lib/blocks/registry.js';
import { resolveTranslation } from '../../lib/content/resolve.js';
import '../../lib/blocks/index.js';

/**
 * Renders an ordered list of blocks for one locale.
 * A block with no publishable content in any locale is skipped entirely,
 * so a partly-translated page is short rather than broken.
 */
export default function BlockRenderer({ blocks = [], locale }) {
  return (
    <>
      {blocks.map((block) => {
        const def = getBlock(block.type);
        if (!def) return null;
        const resolved = resolveTranslation(block.translations, locale);
        if (!resolved) return null;
        const Component = def.Component;
        return <Component key={block.id} data={resolved.data} locale={resolved.locale} />;
      })}
    </>
  );
}
