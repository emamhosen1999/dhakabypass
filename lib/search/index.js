/**
 * Site search (W5.14, B-E3) — pure.
 *
 * The site is small (tens of pages, a few hundred translations), so the index
 * is simply every published document's title and text in the reader's
 * language, built from the database and cached, and a query is ranked in
 * memory. No search service, no extra table to keep in step with the content:
 * a page an operator publishes is searchable on the next cache refresh, and
 * one they unpublish is not.
 */

/** Keys whose string values are addresses, choices or ids, never words. */
const NON_TEXT_KEYS = new Set([
  'href', 'linkHref', 'primaryHref', 'secondaryHref', 'sourceHref', 'image', 'logo', 'src', 'url',
  'type', 'side', 'tone', 'sort', 'status', 'kind', 'menu', 'classes', 'group', 'showFilter', 'showLegend',
  'showInForce', 'source', 'provider', 'videoId', 'datetime', 'category', 'vehicleClass', 'layout',
]);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function plainText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
        return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
      }
      return ENTITIES[e.toLowerCase()] ?? ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every human-readable string in a block's data, in document order. */
export function blockText(data) {
  const out = [];
  const walk = (value, key) => {
    if (key && NON_TEXT_KEYS.has(key)) return;
    if (typeof value === 'string') { const t = plainText(value); if (t) out.push(t); }
    else if (Array.isArray(value)) value.forEach((v) => walk(v, null));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k);
  };
  walk(data, null);
  return out.join(' ');
}

const fold = (s) => String(s || '').toLocaleLowerCase().normalize('NFKC');

/** Words of two or more characters; a Chinese or Bangla run counts as a word. */
export function terms(query) {
  return [...new Set(fold(query).split(/[\s,.;:!?()"'«»“”‘’/\\|]+/).filter((w) => w.length >= 2 || /[^\x00-\x7F]/.test(w)))].slice(0, 8);
}

function snippet(text, words, size = 180) {
  const lower = fold(text);
  let at = -1;
  for (const w of words) { const i = lower.indexOf(w); if (i !== -1 && (at === -1 || i < at)) at = i; }
  if (at === -1) return text.length > size ? `${text.slice(0, size).trimEnd()}…` : text;
  const start = Math.max(0, at - Math.floor(size / 3));
  const piece = text.slice(start, start + size).trim();
  return `${start > 0 ? '…' : ''}${piece}${start + size < text.length ? '…' : ''}`;
}

/**
 * `docs`: [{ href, title, text, kind }]. Every term must appear in the title
 * or the text. A title hit outweighs a body hit; more hits rank higher.
 */
export function searchDocs(docs, query, limit = 30) {
  const words = terms(query);
  if (!words.length) return [];
  const results = [];
  for (const doc of docs || []) {
    const title = fold(doc.title);
    const text = fold(doc.text);
    let score = 0;
    let all = true;
    for (const w of words) {
      const inTitle = title.includes(w);
      const count = text.split(w).length - 1;
      if (!inTitle && count === 0) { all = false; break; }
      score += (inTitle ? 10 : 0) + Math.min(count, 5);
    }
    if (all) results.push({ href: doc.href, title: doc.title, kind: doc.kind || 'page', score, excerpt: snippet(doc.text || '', words) });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
