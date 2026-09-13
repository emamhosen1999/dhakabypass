import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import '../../lib/blocks/index.js';
import { allBlocks } from '../../lib/blocks/registry.js';

/**
 * Drift guards from the CMS consistency audit (docs/audit/2026-09-12, §6).
 * Each fails the suite when the site drifts back to a fact or a word an
 * operator cannot change.
 */
const ROOT = path.resolve(import.meta.dirname, '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// Line comments first: a `travel/*` inside one must not open a block comment.
const stripComments = (src) => src.replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1').replace(/\/\*[\s\S]*?\*\//g, '');

// Field names a helper builds at runtime rather than spelling out.
const DYNAMIC_FIELDS = { 'interchange-table': { pattern: /^show[A-Z]/, builder: 'show${' } };

/** The source of a module and the project modules it imports, to a depth. */
function sourceClosure(rel, depth = 3, seen = new Set()) {
  const abs = path.join(ROOT, rel);
  if (seen.has(abs) || !fs.existsSync(abs)) return '';
  seen.add(abs);
  const src = fs.readFileSync(abs, 'utf8');
  if (depth === 0) return src;
  let out = src;
  for (const m of src.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    let target = path.relative(ROOT, path.resolve(path.dirname(abs), m[1]));
    if (!/\.(jsx?|mjs)$/.test(target)) {
      target = ['.js', '.jsx'].map((e) => target + e).find((x) => fs.existsSync(path.join(ROOT, x))) || target;
    }
    if (/^(lib|components)[\\/]/.test(target) && !/[\\/]types[\\/]/.test(target)) {
      out += '\n' + sourceClosure(target, depth - 1, seen);
    }
  }
  return out;
}

function walk(dir, filter) {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(rel, filter));
    else if (filter(rel)) out.push(rel);
  }
  return out;
}

const typeFiles = walk('lib/blocks/types', (f) => f.endsWith('.js'));
const typeFileOf = new Map(typeFiles.map((f) => [read(f).match(/export default \{\s*type:\s*'([^']+)'/)?.[1], f]));
function componentOf(type) {
  const typeFile = typeFileOf.get(type);
  const rel = read(typeFile).match(/import\s+\w+\s+from\s+'(\.\.\/\.\.\/\.\.\/components\/blocks\/[^']+)'/)[1];
  return path.relative(ROOT, path.resolve(path.dirname(path.join(ROOT, typeFile)), rel));
}

describe('6.11 block type and renderer field parity', () => {
  it('every declared field and row field is read by the renderer or a helper it imports', () => {
    const unread = [];
    for (const def of allBlocks()) {
      const src = stripComments(sourceClosure(componentOf(def.type)));
      const names = def.fields.flatMap((f) => [f.name, ...(f.itemFields || []).map((s) => s.name)]);
      const dynamic = DYNAMIC_FIELDS[def.type];
      for (const name of names) {
        if (dynamic && dynamic.pattern.test(name) && src.includes(dynamic.builder)) continue;
        if (!new RegExp(`\\b${name}\\b`).test(src)) unread.push(`${def.type}.${name}`);
      }
    }
    expect(unread).toEqual([]);
  });

  it('no renderer reads a data key its type does not declare', () => {
    const undeclared = new Set();
    for (const def of allBlocks()) {
      const src = stripComments(read(componentOf(def.type)));
      const declared = new Set(def.fields.map((f) => f.name));
      for (const m of src.matchAll(/\bdata\??\.(\w+)/g)) {
        if (!declared.has(m[1])) undeclared.add(`${def.type}: data.${m[1]}`);
      }
    }
    expect([...undeclared]).toEqual([]);
  });
});

describe('6.12 no literal public wording or facts in the renderers', () => {
  const files = ['components/chrome', 'components/blocks', 'components/corridor', 'components/contact']
    .flatMap((d) => walk(d, (f) => /\.jsx?$/.test(f)));

  it('has no literal aria-label, title, placeholder or alt text', () => {
    const hits = [];
    for (const f of files) {
      const src = stripComments(read(f));
      for (const m of src.matchAll(/\b(aria-label|title|placeholder|alt)="([^"]*[A-Za-z][^"]*)"/g)) hits.push(`${f}: ${m[0]}`);
    }
    expect(hits).toEqual([]);
  });

  it('has no emergency number, length, chainage, road number or terminus name', () => {
    const FACT = /\b999\b|\b\d+(\.\d+)? ?km\b|K\d+\+\d{3}|Naojor|Madanpur|Joydebpur|\bN105\b/;
    const hits = [];
    for (const f of files) {
      const m = stripComments(read(f)).match(FACT);
      if (m) hits.push(`${f}: ${m[0]}`);
    }
    expect(hits).toEqual([]);
  });

  it('keeps the map alt text a template filled from the waypoint records', async () => {
    const { UI } = await import('../../lib/i18n/ui.js');
    for (const locale of ['en', 'bn', 'zh']) {
      expect(UI[locale].mapAltText, locale).toContain('{from}');
      expect(UI[locale].mapAltText, locale).toContain('{to}');
      expect(UI[locale].mapAltText, locale).not.toMatch(/Naojor|Madanpur|নাওজোড়|মদনপুর/);
    }
  });
});

describe('6.14 every setting the site reads has a field in the admin', () => {
  it('reads no site_settings key that no admin screen writes', () => {
    const readers = ['lib', 'components'].flatMap((d) => walk(d, (f) => /\.jsx?$/.test(f)))
      .map((f) => stripComments(read(f))).join('\n');
    // The admin screens and the admin-side modules they call (lib/**/*admin*).
    const admin = [...walk('app/admin', (f) => /\.jsx?$/.test(f)), ...walk('lib', (f) => /admin[^\\/]*\.js$/.test(f))]
      .map((f) => read(f)).join('\n');
    const keys = new Set([...readers.matchAll(/getSetting\(\s*'([a-z_]+\.[a-z_]+)'/g)].map((m) => m[1]));
    const settingsSrc = read('lib/settings.js') + read('lib/seo/settings.js');
    const viaConstant = new Map();
    for (const [, name, body] of settingsSrc.matchAll(/export const (\w+_KEYS)\s*=\s*(?:Object\.freeze\()?\{([\s\S]*?)\}/g)) {
      for (const m of body.matchAll(/(\w+):\s*'([a-z_]+\.[a-z_]+)'/g)) viaConstant.set(m[2], `${name}.${m[1]}`);
    }
    // A constant the admin iterates (Object.keys / Object.entries) writes all of its keys.
    const iterated = (ref) => new RegExp(`Object\\.(keys|entries)\\(${ref.split('.')[0]}\\)`).test(admin);
    const missing = [...new Set([...keys, ...viaConstant.keys()])].filter((k) => !admin.includes(`'${k}'`)
      && !(viaConstant.has(k) && (admin.includes(viaConstant.get(k)) || iterated(viaConstant.get(k)))));
    expect(missing).toEqual([]);
  });
});

describe('6.16 a block shown in English on a translated page says so', () => {
  it('keeps the page locale for chrome and prints the notice', async () => {
    const { default: BlockRenderer } = await import('../../components/blocks/BlockRenderer.jsx');
    const { t } = await import('../../lib/i18n/ui.js');
    const block = { id: 9, type: 'rich-text', translations: [{ locale: 'en', status: 'published', data: { heading: 'English only', body: '<p>x</p>' } }] };
    const html = renderToStaticMarkup(<BlockRenderer blocks={[block]} locale="bn" />);
    expect(html).toContain(t('bn', 'blockInEnglish'));
    expect(html).toContain('lang="en"');
    expect(html).toContain('English only');
    const native = renderToStaticMarkup(<BlockRenderer blocks={[block]} locale="en" />);
    expect(native).not.toContain(t('en', 'blockInEnglish'));
  });
});

describe('6.17 the SEO defaults make no claim', () => {
  it('names the site and carries no figure', async () => {
    const { SEO_DEFAULTS } = await import('../../lib/seo/settings.js');
    for (const k of ['siteTitle', 'siteDescription']) {
      expect(SEO_DEFAULTS[k], k).toMatch(/Dhaka Bypass Expressway/);
      expect(SEO_DEFAULTS[k], k).not.toMatch(/\d|first|largest|fully/i);
    }
  });
});

describe('6.19 the map road names are a record', () => {
  it('imports no static name table', () => {
    expect(read('lib/corridor/view.js')).not.toMatch(/road-references|ROAD_REFERENCES/);
    expect(fs.existsSync(path.join(ROOT, 'lib/corridor/road-references.js'))).toBe(false);
  });

  it('resolves a road name per language from the record, OpenStreetMap otherwise', async () => {
    const { resolveRoad } = await import('../../lib/corridor/road-names.js');
    const road = { id: 42, ref: 'N1', name: 'OSM name' };
    const records = [{ key: 'N1', names: { en: 'Dhaka–Chattogram Highway', bn: 'ঢাকা–চট্টগ্রাম মহাসড়ক' }, source: 'https://rhd.gov.bd/x' }];
    expect(resolveRoad(road, records, 'bn')).toEqual({ name: 'ঢাকা–চট্টগ্রাম মহাসড়ক', source: 'https://rhd.gov.bd/x' });
    expect(resolveRoad(road, records, 'zh').name).toBe('Dhaka–Chattogram Highway');
    expect(resolveRoad(road, [], 'en')).toEqual({ name: 'OSM name', source: 'https://www.openstreetmap.org/way/42' });
  });
});

describe('6.20 chrome link targets come from menus or settings', () => {
  it('has no literal page href in the header or footer', () => {
    const ALLOWED = new Set(['#main', '/${locale}']);
    const hits = [];
    for (const f of walk('components/chrome', (x) => /\.jsx?$/.test(x))) {
      const src = stripComments(read(f));
      for (const m of src.matchAll(/href=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)) {
        const v = m[1] ?? m[2] ?? m[3];
        if (ALLOWED.has(v) || /^(tel|mailto):\$\{/.test(v)) continue;
        hits.push(`${f}: href=${v}`);
      }
      for (const m of src.matchAll(/localeHref\(\s*'([^']+)'/g)) hits.push(`${f}: localeHref('${m[1]}')`);
    }
    expect(hits).toEqual([]);
  });
});
