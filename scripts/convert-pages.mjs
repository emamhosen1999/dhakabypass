/**
 * Converts the captured live DOM (.extract/*.html) into real JSX page components
 * plus an editable content model.
 *
 * Every meaningful text node and image src becomes a keyed field in
 * content/pages/<slug>.json, and the JSX references it as {c.<key>} — so the
 * markup stays byte-faithful to the original while 100% of the copy and imagery
 * is admin-editable.
 *
 * Also emits content/schema/<slug>.json describing each field (label, type,
 * multiline) so the admin can render structured forms instead of raw JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXTRACT = path.join(ROOT, '.extract');
const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const SCHEMA_DIR = path.join(ROOT, 'content', 'schema');

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'path', 'circle', 'line', 'polyline', 'rect', 'ellipse', 'polygon', 'use', 'stop']);

// attributes that are runtime artifacts of radix/react — drop them
const DROP_ATTRS = new Set([
  'data-state', 'aria-controls', 'data-slot', 'aria-haspopup', 'aria-expanded',
  'data-nimg', 'decoding', 'srcset', 'sizes', 'loading', 'data-aria-hidden',
]);

const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  maxlength: 'maxLength',
  autocomplete: 'autoComplete',
  readonly: 'readOnly',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'stroke-miterlimit': 'strokeMiterlimit',
  viewbox: 'viewBox',
  xmlns: 'xmlns',
  'xlink:href': 'xlinkHref',
  // SVG camelCase attributes (no hyphen, so camel() can't infer them)
  stddeviation: 'stdDeviation',
  preserveaspectratio: 'preserveAspectRatio',
  gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform',
  patternunits: 'patternUnits',
  patterntransform: 'patternTransform',
  clippath: 'clipPath',
  clippathunits: 'clipPathUnits',
  markerwidth: 'markerWidth',
  markerheight: 'markerHeight',
  markerunits: 'markerUnits',
  refx: 'refX',
  refy: 'refY',
  spreadmethod: 'spreadMethod',
  basefrequency: 'baseFrequency',
  numoctaves: 'numOctaves',
  stopcolor: 'stopColor',
  stopopacity: 'stopOpacity',
  floodcolor: 'floodColor',
  floodopacity: 'floodOpacity',
  textanchor: 'textAnchor',
  filterunits: 'filterUnits',
  primitiveunits: 'primitiveUnits',
  maskunits: 'maskUnits',
  maskcontentunits: 'maskContentUnits',
};

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// SVG element names are case-sensitive in JSX; the parser lowercases them.
const SVG_TAGS = Object.fromEntries(
  ['linearGradient','radialGradient','clipPath','textPath','foreignObject','feGaussianBlur','feComposite','feDropShadow','feBlend','feColorMatrix','feOffset','feMerge','feMergeNode','feFlood','feTurbulence','animateTransform','animateMotion'].map((t) => [t.toLowerCase(), t])
);

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/** /_next/image?url=%2Fphoto%2F1.webp&w=640 -> /photo/1.webp */
function normalizeSrc(src) {
  if (!src) return src;
  if (src.startsWith('/_next/image')) {
    try {
      const u = new URL(src, 'https://x');
      const real = u.searchParams.get('url');
      if (real) return decodeURIComponent(real);
    } catch {}
  }
  // dead placeholder endpoint in the original -> caller substitutes a real image
  if (src.includes('/api/placeholder')) return null;
  return src;
}

function styleToObject(style) {
  const out = {};
  for (const decl of style.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k || !v) continue;
    out[camel(k)] = v;
  }
  return out;
}

export function convert(html, slug, opts = {}) {
  const { heroFallback = null } = opts;
  const root = parse(html, { comment: false });

  const content = {};
  const schema = [];
  let ti = 0;
  let ii = 0;
  let lastHeading = 'Content';

  const addText = (value, tag) => {
    const key = `t${++ti}`;
    content[key] = value;
    schema.push({
      key,
      type: 'text',
      section: lastHeading,
      multiline: value.length > 90,
      label: /^h[1-6]$/.test(tag) ? `Heading (${tag})` : tag === 'li' ? 'List item' : tag === 'p' ? 'Paragraph' : 'Text',
    });
    return key;
  };
  const addImage = (value) => {
    const key = `img${++ii}`;
    content[key] = value;
    schema.push({ key, type: 'image', section: lastHeading, label: 'Image' });
    return key;
  };

  function walk(node, depth) {
    const pad = '  '.repeat(depth);

    // text node
    if (node.nodeType === 3) {
      const raw = decodeEntities(node.rawText);
      const text = raw.replace(/\s+/g, ' ');
      if (!text.trim()) return '';
      const parentTag = node.parentNode?.rawTagName?.toLowerCase() || 'span';
      const key = addText(text.trim(), parentTag);
      return `${pad}{c.${key}}\n`;
    }
    if (node.nodeType !== 1) return '';

    const lower = node.rawTagName?.toLowerCase();
    const tag = SVG_TAGS[lower] || lower;
    if (!tag || tag === 'script' || tag === 'style' || tag === 'next-route-announcer') return '';

    // track section for admin grouping
    if (/^h[1-3]$/.test(tag)) {
      const t = node.text.replace(/\s+/g, ' ').trim();
      if (t) lastHeading = t.slice(0, 60);
    }

    const attrs = [];
    for (const [name, value] of Object.entries(node.attributes || {})) {
      const lname = name.toLowerCase();
      if (DROP_ATTRS.has(lname)) continue;

      if (lname === 'style') {
        const obj = styleToObject(decodeEntities(value));
        // make background-image editable
        if (obj.backgroundImage) {
          const m = obj.backgroundImage.match(/url\(['"]?([^'")]+)['"]?\)/);
          if (m) {
            let src = normalizeSrc(m[1]);
            if (src === null) src = heroFallback || '/bg-hero.webp';
            const key = addImage(src);
            const rest = Object.entries(obj)
              .filter(([k]) => k !== 'backgroundImage')
              .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
              .join(', ');
            attrs.push(
              `style={{ backgroundImage: \`url('\${c.${key}}')\`${rest ? ', ' + rest : ''} }}`
            );
            continue;
          }
        }
        const body = Object.entries(obj).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
        if (body) attrs.push(`style={{ ${body} }}`);
        continue;
      }

      if (tag === 'img' && lname === 'src') {
        let src = normalizeSrc(decodeEntities(value));
        if (src === null) src = heroFallback || '/road.webp';
        const key = addImage(src);
        attrs.push(`src={c.${key}}`);
        continue;
      }

      const jsxName = ATTR_MAP[lname] || (lname.startsWith('data-') || lname.startsWith('aria-') ? lname : camel(lname));
      attrs.push(`${jsxName}=${JSON.stringify(decodeEntities(value))}`);
    }

    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

    if (VOID.has(tag)) return `${pad}<${tag}${attrStr} />\n`;

    const children = (node.childNodes || []).map((ch) => walk(ch, depth + 1)).join('');
    if (!children) return `${pad}<${tag}${attrStr} />\n`;
    return `${pad}<${tag}${attrStr}>\n${children}${pad}</${tag}>\n`;
  }

  const body = (root.childNodes || []).map((n) => walk(n, 3)).join('');

  const componentName =
    slug.split(/[-/]/).map((s) => s[0].toUpperCase() + s.slice(1)).join('') + 'Page';

  const jsx = `import { getContent } from '${slug.includes('/') ? '../../..' : '../..'}/lib/content';

export const dynamic = 'force-dynamic';

/**
 * ${slug} — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.${slug}" so the admin
 * panel can edit every field.
 */
export default async function ${componentName}() {
  const c = await getContent('page.${slug}');
  return (
    <>
${body}    </>
  );
}
`;

  return { jsx, content, schema };
}

// ---- run ----
const PAGES = [
  { slug: 'project', file: 'extract-project.html', route: 'project' },
  { slug: 'project/overview', file: 'extract-project-overview.html', route: 'project/overview' },
  { slug: 'economic-impact', file: 'extract-economic-impact.html', route: 'economic-impact' },
  { slug: 'routes-facilities', file: 'extract-routes-facilities.html', route: 'routes-facilities' },
  { slug: 'stakeholders', file: 'extract-stakeholders.html', route: 'stakeholders' },
  { slug: 'chinese-contribution', file: 'extract-chinese-contribution.html', route: 'chinese-contribution' },
  { slug: 'latest-updates', file: 'extract-latest-updates.html', route: 'latest-updates' },
  { slug: 'contact', file: 'extract-contact.html', route: 'contact' },
];

// real photos to replace the original's dead /api/placeholder hero images
const HERO_FALLBACK = {
  project: '/bypass-ex.webp',
  'economic-impact': '/eco-eff.webp',
  stakeholders: '/friends.webp',
  'latest-updates': '/road.webp',
};

fs.mkdirSync(PAGES_DIR, { recursive: true });
fs.mkdirSync(SCHEMA_DIR, { recursive: true });

for (const p of PAGES) {
  const fp = path.join(EXTRACT, p.file);
  if (!fs.existsSync(fp)) {
    console.log(`SKIP ${p.slug} (no ${p.file})`);
    continue;
  }
  let html = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const { jsx, content, schema } = convert(html, p.slug, {
    heroFallback: HERO_FALLBACK[p.slug],
  });

  const outDir = path.join(ROOT, 'app', ...p.route.split('/'));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'page.jsx'), jsx);

  const flat = p.slug.replace('/', '__');
  fs.writeFileSync(path.join(PAGES_DIR, `${flat}.json`), JSON.stringify(content, null, 2));
  fs.writeFileSync(path.join(SCHEMA_DIR, `${flat}.json`), JSON.stringify(schema, null, 2));

  console.log(
    `${p.slug.padEnd(22)} jsx=${(jsx.length / 1024).toFixed(1)}kb  texts=${Object.keys(content).filter((k) => k.startsWith('t')).length}  images=${Object.keys(content).filter((k) => k.startsWith('img')).length}`
  );
}
console.log('\nDone.');
