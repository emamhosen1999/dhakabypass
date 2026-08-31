import { registerBlock, getBlock } from './registry.js';
import richText from './types/rich-text.js';
import statRow from './types/stat-row.js';

const ALL = [richText, statRow];

/** Idempotent: safe to call from every entry point that needs the registry. */
export function registerAllBlocks() {
  for (const def of ALL) {
    if (!getBlock(def.type)) registerBlock(def);
  }
}

registerAllBlocks();
