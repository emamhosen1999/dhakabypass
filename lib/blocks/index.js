import { registerBlock, getBlock } from './registry.js';
import cardGrid from './types/card-grid.js';
import figureGrid from './types/figure-grid.js';
import hero from './types/hero.js';
import mediaProse from './types/media-prose.js';
import richText from './types/rich-text.js';
import statRow from './types/stat-row.js';

const ALL = [hero, mediaProse, figureGrid, cardGrid, richText, statRow];

/** Idempotent: safe to call from every entry point that needs the registry. */
export function registerAllBlocks() {
  for (const def of ALL) {
    if (!getBlock(def.type)) registerBlock(def);
  }
}

registerAllBlocks();
