// tests/unit/blocks-registry-coverage.test.js
//
// The trap this exists to make impossible again.
//
// Ten block components were written, reviewed and unit-tested — and none of
// them was ever added to `lib/blocks/index.js`. BlockRenderer resolves a
// block through `getBlock(block.type)` and renders nothing when that returns
// null, so every one of them vanished silently from every page. The component
// tests looked healthy the whole time because they import the component
// directly and never touch the registry, which is exactly the gap this file
// closes: nothing else in the suite connects the two.
//
// Read off the filesystem on purpose. A hand-written list of expected types
// would have to be edited by the same person who forgot to edit the registry.
import { describe, it, expect, beforeAll } from 'vitest';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { allBlocks } from '../../lib/blocks/registry.js';

beforeAll(async () => { await import('../../lib/blocks/index.js'); });

const dir = fileURLToPath(new URL('../../components/blocks/', import.meta.url));

/** Every renderer, by convention `<Name>Block.jsx`. BlockRenderer is the
 *  dispatcher, not a block, and is excluded by that same convention. */
const componentFiles = readdirSync(dir)
  .filter((f) => f.endsWith('Block.jsx'))
  .map((f) => f.replace(/\.jsx$/, ''));

describe('every block component is reachable through the registry', () => {
  it('found the component directory', () => {
    expect(componentFiles.length).toBeGreaterThan(0);
  });

  it.each(componentFiles)('%s is registered as a block type', (name) => {
    const rendered = allBlocks().map((def) => def.Component.name);
    expect(rendered).toContain(name);
  });

  it('registers no type whose Component is not a function', () => {
    for (const def of allBlocks()) {
      expect(typeof def.Component, `${def.type} has no Component`).toBe('function');
    }
  });

  it('gives every registered type a label and a fields array', () => {
    for (const def of allBlocks()) {
      expect(typeof def.label, `${def.type} has no label`).toBe('string');
      expect(def.label.length).toBeGreaterThan(0);
      expect(Array.isArray(def.fields), `${def.type} has no fields`).toBe(true);
    }
  });

  it('registers exactly one type per component, with no duplicate renderer', () => {
    const rendered = allBlocks().map((def) => def.Component.name);
    expect(new Set(rendered).size).toBe(rendered.length);
  });
});
