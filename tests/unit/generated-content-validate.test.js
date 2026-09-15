import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { getBlock, validateBlockData } from '../../lib/blocks/registry.js';
import { sanitizeHtml } from '../../lib/html/sanitize.js';

/**
 * The content generators (scripts/content/gen_pages.py, gen_samples.py) write
 * a dump of every block they emit, in every language. Each must be a
 * registered type whose data passes the validation the editor applies on
 * Publish and whose rich text the sanitizer leaves unchanged, or an operator could never
 * re-save it.
 */
const dir = path.resolve(import.meta.dirname, '../../scripts/content');
const dumps = fs.readdirSync(dir).filter((f) => f.endsWith('-dump.json'));

describe('generated content validates', () => {
  registerAllBlocks();
  it.each(dumps)('%s', (file) => {
    const rows = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    expect(rows.length).toBeGreaterThan(0);
    const problems = [];
    for (const r of rows) {
      if (!getBlock(r.type)) { problems.push(`${r.slug} ${r.locale}: unknown type ${r.type}`); continue; }
      const check = validateBlockData(r.type, r.data);
      if (!check.ok) problems.push(`${r.slug} ${r.locale} ${r.type}: ${check.errors.join('; ')}`);
      // Rich-text fields are stored as the sanitizer leaves them; generated HTML must already be clean.
      for (const f of getBlock(r.type).fields) {
        if (f.type === 'richtext' && typeof r.data[f.name] === 'string' && sanitizeHtml(r.data[f.name]) !== r.data[f.name]) {
          problems.push(`${r.slug} ${r.locale} ${r.type}.${f.name}: sanitizer would change the HTML`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
