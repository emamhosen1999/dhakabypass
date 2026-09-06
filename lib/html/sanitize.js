/**
 * A small allowlist HTML sanitiser for editor output.
 *
 * Why this exists: `RichTextBlock` and `MediaProseBlock` hand `data.body`
 * straight to `dangerouslySetInnerHTML`. Until W1.3 that HTML was typed by
 * hand into a textarea; now a contenteditable surface produces it, which
 * means browser-generated markup (`<div>`, `<font>`, `style=`) and, in the
 * worst case, whatever a compromised or over-privileged admin session pastes.
 * Nothing from the editor reaches `block_translations.data` unsanitised.
 *
 * Why not a library: the project deliberately carries very few runtime
 * dependencies (see package.json), and the only HTML parser in the tree
 * (`node-html-parser`) is a devDependency used by build scripts. This is a
 * single-pass tokeniser with an explicit allowlist — it never round-trips
 * through a DOM, so it has no "parse differently the second time" class of
 * bug, and it is small enough to read in one sitting.
 *
 * What it deliberately preserves: the `db-*` class convention the seeded
 * content depends on (`db-pending`, `db-pending-tag`,
 * `db-provisional-inline` — see db/sql/02-seed.sql and app/design-tokens.css).
 * Classes are inert, so the rule is "any `db-` class, nothing else".
 */

/** Tags kept as-is. Everything here is styled by `.db-prose`. */
const ALLOWED = new Set([
  'p', 'br', 'hr', 'strong', 'em', 'u', 's', 'sub', 'sup', 'code', 'pre',
  'blockquote', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'span',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'dl', 'dt', 'dd', 'figure', 'figcaption', 'abbr', 'small',
]);

/**
 * Tags browsers emit that mean something we already have a tag for. `div`
 * becomes `p` rather than being unwrapped: unwrapping would silently join
 * two paragraphs into one, which is a content change, not a clean-up.
 * `h1` becomes `h2` because the page template already owns the single h1.
 */
const TAG_MAP = {
  b: 'strong', i: 'em', strike: 's', div: 'p', h1: 'h2', h5: 'h4', h6: 'h4',
};

/** Dropped together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template',
  'textarea', 'title', 'svg', 'math', 'form', 'head', 'frameset', 'applet',
]);

const VOID = new Set(['br', 'hr']);

/** Opening one of these implicitly closes an identical open tag. */
const CLOSES_SAME = new Set(['p', 'li', 'dt', 'dd', 'h2', 'h3', 'h4']);

/** Opening one of these closes an open `p` — a paragraph holds no blocks. */
const BLOCK = new Set([
  'p', 'ul', 'ol', 'h2', 'h3', 'h4', 'blockquote', 'table', 'hr', 'figure', 'dl', 'pre',
]);

/** Attributes kept, per tag. Emitted in this order so output is stable. */
const ATTRS = {
  a: ['href', 'target', 'rel', 'class', 'title'],
  th: ['class', 'title', 'colspan', 'rowspan'],
  td: ['class', 'title', 'colspan', 'rowspan'],
  abbr: ['class', 'title'],
  '*': ['class', 'title'],
};

const SAFE_SCHEMES = /^(?:https?|mailto|tel):/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.\-]*:/i;

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', colon: ':', tab: '\t', newline: '\n',
};

function decodeEntities(s) {
  return String(s).replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);?/gi, (m, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    const key = body.toLowerCase();
    return Object.hasOwn(NAMED, key) ? NAMED[key] : m;
  });
}

/** Leaves already-valid entities alone so `&amp;` does not become `&amp;amp;`. */
const escapeAmp = (s) => s.replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;');

const escapeText = (s) => escapeAmp(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (s) => escapeAmp(String(s))
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isStrippable = (c) => {
  const n = c.charCodeAt(0);
  // C0 controls and space, DEL, and the C1 block. Written as codepoint
  // comparisons rather than a character class so no literal control byte
  // can end up in this source file.
  return n <= 32 || (n >= 127 && n <= 160);
};

/**
 * Returns the value to emit, or null to drop the attribute. The check runs
 * on a fully decoded, control-character-stripped copy — `java&#9;script:`
 * and `&#106;avascript:` are the two classic bypasses and both collapse to
 * `javascript:` here.
 */
function safeHref(raw) {
  const value = String(raw).trim();
  const probe = decodeEntities(value).split('').filter((c) => !isStrippable(c)).join('');
  if (SAFE_SCHEMES.test(probe)) return value;
  if (ANY_SCHEME.test(probe)) return null;
  return value; // relative, root-relative, query or fragment
}

function safeClass(raw) {
  const kept = String(raw).split(/\s+/).filter((c) => /^db-[a-z0-9-]+$/.test(c));
  return kept.length ? kept.join(' ') : null;
}

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function parseAttrs(source) {
  const out = new Map();
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(source))) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    if (!out.has(name)) out.set(name, value);
  }
  return out;
}

function renderAttrs(tag, attrs) {
  const allowed = ATTRS[tag] || ATTRS['*'];
  const kept = new Map();

  for (const name of allowed) {
    if (!attrs.has(name)) continue;
    const raw = attrs.get(name);
    if (name === 'class') {
      const cls = safeClass(raw);
      if (cls) kept.set('class', cls);
    } else if (name === 'href') {
      const href = safeHref(raw);
      if (href !== null) kept.set('href', href);
    } else if (name === 'target') {
      if (String(raw).trim().toLowerCase() === '_blank') kept.set('target', '_blank');
    } else if (name === 'colspan' || name === 'rowspan') {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n > 0 && n < 100) kept.set(name, String(n));
    } else {
      kept.set(name, String(raw));
    }
  }

  // A `target="_blank"` link without this leaks `window.opener`. Force it
  // rather than trusting whatever `rel` the editor happened to write.
  if (kept.get('target') === '_blank') kept.set('rel', 'noopener noreferrer');
  else kept.delete('rel');
  if (tag === 'a' && !kept.has('href')) kept.delete('target');

  let out = '';
  for (const name of allowed) {
    if (kept.has(name)) out += ` ${name}="${escapeAttr(kept.get(name))}"`;
  }
  return out;
}

const OPEN_RE = /^<([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/;
const CLOSE_RE = /^<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/;

export function sanitizeHtml(input) {
  if (typeof input !== 'string' || input === '') return '';

  let out = '';
  const stack = [];
  let i = 0;

  const closeThrough = (tag) => {
    const at = stack.lastIndexOf(tag);
    if (at === -1) return false;
    while (stack.length > at) out += `</${stack.pop()}>`;
    return true;
  };

  while (i < input.length) {
    const lt = input.indexOf('<', i);
    if (lt === -1) { out += escapeText(input.slice(i)); break; }
    if (lt > i) out += escapeText(input.slice(i, lt));

    const rest = input.slice(lt);

    if (rest.startsWith('<!--')) {
      const end = input.indexOf('-->', lt + 4);
      i = end === -1 ? input.length : end + 3;
      continue;
    }
    if (/^<[!?]/.test(rest)) {
      const end = input.indexOf('>', lt + 1);
      i = end === -1 ? input.length : end + 1;
      continue;
    }

    const close = CLOSE_RE.exec(rest);
    if (close) {
      const raw = close[1].toLowerCase();
      const tag = TAG_MAP[raw] || raw;
      if (ALLOWED.has(tag) && !VOID.has(tag)) closeThrough(tag);
      i = lt + close[0].length;
      continue;
    }

    const open = OPEN_RE.exec(rest);
    if (!open) { out += '&lt;'; i = lt + 1; continue; }

    const raw = open[1].toLowerCase();
    const selfClosing = open[3] === '/';
    i = lt + open[0].length;

    if (DROP_WITH_CONTENT.has(raw)) {
      if (selfClosing) continue;
      const endRe = new RegExp(`</${raw}\\s*>`, 'i');
      const tail = input.slice(i);
      const hit = endRe.exec(tail);
      i = hit ? i + hit.index + hit[0].length : input.length;
      continue;
    }

    const tag = TAG_MAP[raw] || raw;
    if (!ALLOWED.has(tag)) continue; // unwrap: children survive, the tag does not

    if (VOID.has(tag)) { out += `<${tag}${renderAttrs(tag, parseAttrs(open[2]))}>`; continue; }

    if (CLOSES_SAME.has(tag)) closeThrough(tag);
    if (BLOCK.has(tag)) closeThrough('p');

    out += `<${tag}${renderAttrs(tag, parseAttrs(open[2]))}>`;
    stack.push(tag);
    if (selfClosing) out += `</${stack.pop()}>`;
  }

  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}
