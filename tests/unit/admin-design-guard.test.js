import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * One admin design language (UI audit UI-ADM-03/04). The audit counted three
 * dialects of primary button and heading; the black button and the oversized
 * page title are the two that can creep back in, so they are refused here.
 */
const ROOT = path.resolve(import.meta.dirname, '../..');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : /\.jsx?$/.test(e.name) ? [p] : [];
});

describe('admin design language', () => {
  const files = [...walk(path.join(ROOT, 'app/admin')), ...walk(path.join(ROOT, 'components/admin'))];
  it('has no black buttons or text-3xl titles', () => {
    const hits = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      if (/\bbg-black\b/.test(src)) hits.push(`${path.relative(ROOT, f)}: bg-black`);
      if (/\btext-3xl\b/.test(src)) hits.push(`${path.relative(ROOT, f)}: text-3xl`);
    }
    expect(hits).toEqual([]);
  });
});
