import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { UI } from '../../lib/i18n/ui.js';

/**
 * Every ui string an operator can edit at /admin/translations is shown
 * somewhere (audit 4.6 / 6.13). A key with no call site is a dead end: the
 * operator edits it and nothing on the site changes.
 *
 * A key counts as referenced when its name appears quoted in app/,
 * components/ or lib/ (outside ui.js itself). Keys built at runtime from a
 * record value are reached through a declared prefix instead.
 */
const ROOT = path.resolve(import.meta.dirname, '../..');
const DYNAMIC_PREFIXES = ['requestKind_', 'traffic_', 'social_'];

function sources() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(jsx?|mjs)$/.test(e.name) && p !== path.join(ROOT, 'lib/i18n/ui.js')) out.push(fs.readFileSync(p, 'utf8'));
    }
  };
  for (const d of ['app', 'components', 'lib']) walk(path.join(ROOT, d));
  return out.join('\n');
}

describe('ui string keys', () => {
  it('has a call site for every key, or a declared dynamic prefix', () => {
    const src = sources();
    const unused = Object.keys(UI.en).filter((k) =>
      !DYNAMIC_PREFIXES.some((p) => k.startsWith(p))
      && !src.includes(`'${k}'`) && !src.includes(`"${k}"`) && !src.includes(`\`${k}\``));
    expect(unused).toEqual([]);
  });

  it('every dynamic prefix is actually built at runtime somewhere', () => {
    const src = sources();
    for (const p of DYNAMIC_PREFIXES) expect(src, p).toContain(`\`${p}\${`);
  });
});
