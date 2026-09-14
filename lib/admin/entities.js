/**
 * Every kind of record the admin can change, described once, so history,
 * trash, restore and the activity log treat them all the same way (W7.4, W7.5).
 *
 * An entity names:
 *   table     where its own row lives
 *   key       the column(s) its id stands for; a composite id is "a:b"
 *   children  rows that belong to it and go (and come back) with it —
 *             { table, where(id, row) → [sql, params] }, listed parent-first
 *   label     a sentence-case name an operator recognises, from the snapshot
 *   noun      what to call one of these in a sentence
 *   can       the capability needed to restore it
 *   href      the screen it is edited on
 *   redact    columns never written to history (a trashed row keeps them so a
 *             restore is whole; they are never displayed)
 *   hidden    columns not worth showing in a comparison
 *
 * Pure data and pure functions: no database access here, so the registry is
 * tested without one.
 */

const en = (v) => {
  if (v == null) return '';
  const o = typeof v === 'string' ? safeParse(v) : v;
  if (o && typeof o === 'object') return String(o.en || Object.values(o).find(Boolean) || '');
  return String(v);
};

export function safeParse(v) {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!(t.startsWith('{') || t.startsWith('['))) return v;
  try { return JSON.parse(t); } catch { return v; }
}

const km = (m) => {
  const n = Number(m);
  if (!Number.isFinite(n)) return '';
  return `K${Math.floor(n / 1000)}+${String(Math.round(n % 1000)).padStart(3, '0')}`;
};

const main = (snap) => snap?.rows?.[snap.table]?.[0] || {};
const count = (snap, table) => snap?.rows?.[table]?.length || 0;

export const ENTITIES = {
  page: {
    table: 'pages', key: ['id'], noun: 'page', can: 'manage_pages',
    children: [
      { table: 'page_translations', where: (id) => ['page_id = ?', [id]] },
      { table: 'blocks', where: (id) => ['page_id = ?', [id]] },
      { table: 'block_translations', where: (id) => ['block_id IN (SELECT id FROM blocks WHERE page_id = ?)', [id]] },
    ],
    label: (s) => {
      const t = (s.rows?.page_translations || []).find((r) => r.locale === 'en')?.title;
      return `${t || main(s).slug} (/${main(s).slug})`;
    },
    summary: (s) => `${count(s, 'blocks')} blocks, ${count(s, 'block_translations')} block texts`,
    href: (id) => `/admin/pages-v2/${id}`,
  },
  page_settings: {
    table: 'pages', key: ['id'], noun: 'page settings', can: 'manage_pages',
    children: [{ table: 'page_translations', where: (id) => ['page_id = ?', [id]] }],
    label: (s) => `/${main(s).slug}`,
    href: (id) => `/admin/pages-v2/${id}`,
    historyOnly: true,
  },
  block: {
    table: 'blocks', key: ['id'], noun: 'block', can: 'edit_blocks',
    children: [{ table: 'block_translations', where: (id) => ['block_id = ?', [id]] }],
    label: (s) => `"${main(s).type}" block`,
    summary: (s) => `${count(s, 'block_translations')} languages`,
    href: (id, row) => `/admin/pages-v2/${row?.page_id || ''}`,
  },
  news: {
    table: 'news_updates', key: ['id'], noun: 'article', can: 'publish',
    children: [{ table: 'news_translations', where: (id) => ['news_id = ?', [id]] }],
    label: (s) => `"${main(s).title}"`,
    summary: (s) => (count(s, 'news_translations') ? `with ${count(s, 'news_translations')} translations` : ''),
    href: (id) => `/admin/news/${id}`,
  },
  news_translation: {
    table: 'news_translations', key: ['news_id', 'locale'], noun: 'translation', can: 'translate',
    label: (s) => `${main(s).locale} translation of "${main(s).title}"`,
    href: (id) => `/admin/news/${String(id).split(':')[0]}/translations`,
  },
  media: {
    table: 'media', key: ['id'], noun: 'picture', can: 'manage_media',
    label: (s) => main(s).path,
    href: () => '/admin/media',
    hidden: ['width', 'height', 'bytes', 'mime', 'origin', 'original_path'],
  },
  menu_item: {
    table: 'menu_items', key: ['id'], noun: 'link', can: 'manage_pages',
    children: [{ table: 'menu_items', where: (id) => ['parent_id = ?', [id]] }],
    label: (s) => `"${en(main(s).labels)}"`,
    summary: (s) => {
      const n = (s.rows?.menu_items?.length || 1) - 1;
      return n > 0 ? `and ${n} links under it` : '';
    },
    href: () => '/admin/menus',
  },
  menu: {
    table: 'menus', key: ['slug'], noun: 'menu', can: 'manage_pages',
    children: [{ table: 'menu_items', where: (id, row) => ['menu_id = ?', [row?.id ?? 0]] }],
    label: (s) => `the ${main(s).slug} menu`,
    summary: (s) => `${count(s, 'menu_items')} links`,
    href: () => '/admin/menus',
    // Only the items go; the menu row stays so a restore has somewhere to land.
    restoreSkip: ['menus'],
  },
  redirect: {
    table: 'redirects', key: ['id'], noun: 'redirect', can: 'manage_pages',
    label: (s) => `${main(s).source} → ${main(s).destination}`,
    href: () => '/admin/redirects',
  },
  route_meta: {
    table: 'route_meta', key: ['route'], noun: 'search settings', can: 'manage_pages',
    label: (s) => `search settings for ${main(s).route}`,
    href: () => '/admin/seo',
  },
  segment: {
    table: 'segments', key: ['id'], noun: 'segment', can: 'edit_blocks',
    label: (s) => `segment ${km(main(s).from_m)}–${km(main(s).to_m)}`,
    href: () => '/admin/corridor/segments',
  },
  interchange: {
    table: 'interchanges', key: ['id'], noun: 'interchange', can: 'edit_blocks',
    children: [{ table: 'toll_od_rates', where: (id) => ['origin_interchange_id = ? OR destination_interchange_id = ?', [id, id]] }],
    label: (s) => `${en(main(s).names)} (${km(main(s).chainage_m)})`,
    summary: (s) => (count(s, 'toll_od_rates') ? `and ${count(s, 'toll_od_rates')} fares` : ''),
    href: () => '/admin/corridor/interchanges',
  },
  toll_rate: {
    table: 'toll_rates', key: ['id'], noun: 'toll rate', can: 'edit_blocks',
    label: (s) => `${en(main(s).class_labels) || main(s).vehicle_class} from ${String(main(s).effective_from || '').slice(0, 10)}`,
    href: () => '/admin/corridor/tolls',
  },
  toll_od_rate: {
    table: 'toll_od_rates', key: ['id'], noun: 'fare', can: 'edit_blocks',
    label: (s) => `fare ${main(s).vehicle_class} ${main(s).direction} (${main(s).amount_bdt} Tk)`,
    href: () => '/admin/corridor/toll-matrix',
  },
  advisory: {
    table: 'advisories', key: ['id'], noun: 'advisory', can: 'edit_blocks',
    label: (s) => `"${en(main(s).messages).slice(0, 80)}"`,
    href: () => '/admin/corridor/advisories',
  },
  waypoint: {
    table: 'corridor_waypoints', key: ['id'], noun: 'waypoint', can: 'edit_blocks',
    children: [{ table: 'corridor_sections', where: (id, row) => ['from_code = ? OR to_code = ?', [row?.code ?? '', row?.code ?? '']] }],
    label: (s) => `waypoint ${main(s).code}${en(main(s).names) ? ` (${en(main(s).names)})` : ''}`,
    href: () => '/admin/corridor/waypoints',
    // Sections are rebuilt from waypoints; they are carried only so their last
    // measurements can be put back.
    restoreSkip: ['corridor_sections'],
  },
  monthly: {
    table: 'traffic_monthly', key: ['id'], noun: 'monthly count', can: 'edit_blocks',
    label: (s) => `${main(s).plaza} ${String(main(s).month || '').slice(0, 7)}`,
    href: () => '/admin/corridor/monthly',
  },
  road: {
    table: 'corridor_roads', key: ['road_key'], noun: 'road name', can: 'edit_blocks',
    label: (s) => `road name ${main(s).road_key}`,
    href: () => '/admin/corridor/roads',
  },
  camera: {
    table: 'cameras', key: ['id'], noun: 'camera', can: 'edit_blocks',
    label: (s) => `camera "${en(main(s).names)}"`,
    href: () => '/admin/corridor/cameras',
    redact: ['password_sealed'],
    hidden: ['last_ok_at', 'last_error'],
  },
  setting: {
    table: 'site_settings', key: ['setting_key'], noun: 'setting', can: 'manage_users',
    label: (s) => `setting ${main(s).setting_key}`,
    href: () => '/admin/settings',
  },
  ui_string: {
    table: 'ui_strings', key: ['string_key'], noun: 'wording', can: 'translate',
    label: (s) => `wording ${main(s).string_key}`,
    href: () => '/admin/translations',
  },
  service_request: {
    table: 'service_requests', key: ['id'], noun: 'request', can: 'manage_users',
    children: [{ table: 'service_request_events', where: (id) => ['request_id = ?', [id]] }],
    label: (s) => `request ${main(s).tracking_no}`,
    href: () => '/admin/requests',
  },
  user: {
    table: 'users', key: ['id'], noun: 'staff account', can: 'manage_users',
    label: (s) => main(s).email,
    href: () => '/admin/users',
    redact: ['password_hash'],
    historyOnly: true,
  },
  alignment: {
    table: 'corridor_geometry_source', key: ['id'], noun: 'alignment', can: 'edit_blocks',
    children: [{ table: 'corridor_geometry', where: () => ['1 = 1', []] }],
    label: (s) => `alignment (${count(s, 'corridor_geometry')} points, ${main(s).source || 'unknown source'})`,
    href: () => '/admin/corridor/geometry',
    historyOnly: true,
    replaceChildren: ['corridor_geometry', 'corridor_geometry_source'],
  },
};

export function entityDef(type) {
  if (!Object.hasOwn(ENTITIES, type)) throw new Error(`Unknown entity type ${type}`);
  return ENTITIES[type];
}

/** `[sql, params]` selecting the entity's own row(s). */
export function keyWhere(def, id) {
  const parts = def.key.length > 1 ? String(id).split(':') : [id];
  if (parts.length !== def.key.length) throw new Error('Malformed record id');
  return [def.key.map((k) => `\`${k}\` = ?`).join(' AND '), parts];
}

export function describe(type, snap) {
  const def = entityDef(type);
  let label = '';
  let summary = '';
  try { label = def.label(snap) || ''; } catch { label = ''; }
  try { summary = def.summary ? def.summary(snap) || '' : ''; } catch { summary = ''; }
  return { label: label || def.noun, summary, noun: def.noun };
}

const SKIP_ALWAYS = new Set(['updated_at', 'created_at']);

/**
 * Field-by-field differences between an older snapshot row and the current
 * row: `[{ field, before, after }]`. JSON columns are compared per key (a
 * label map shows "names.bn"), redacted and hidden columns never appear.
 */
export function diffRows(type, before = {}, after = {}) {
  const def = entityDef(type);
  const skip = new Set([...(def.redact || []), ...(def.hidden || []), ...SKIP_ALWAYS]);
  const out = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const k of keys) {
    if (skip.has(k)) continue;
    const a = safeParse(before?.[k]);
    const b = safeParse(after?.[k]);
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const sub of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (stable(a[sub]) !== stable(b[sub])) out.push({ field: `${k}.${sub}`, before: display(a[sub]), after: display(b[sub]) });
      }
    } else if (stable(a) !== stable(b)) {
      out.push({ field: k, before: display(a), after: display(b) });
    }
  }
  return out;
}

export function stable(v) {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v !== 'object') return String(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  return `{${Object.keys(v).sort().map((k) => `${k}:${stable(v[k])}`).join(',')}}`;
}

export function display(v) {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'object') {
    const text = JSON.stringify(v);
    return text.length > 300 ? `${text.slice(0, 300)}…` : text;
  }
  const s = String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > 300 ? `${s.slice(0, 300)}…` : s || '—';
}

/** Form field names that are never written to the activity log. */
export function redactDetail(detail = {}) {
  const out = {};
  for (const [k, v] of Object.entries(detail)) {
    if (k.startsWith('$ACTION') || k.startsWith('_')) continue;
    if (/pass|secret|token|hash/i.test(k)) { out[k] = '[redacted]'; continue; }
    if (typeof v !== 'string') continue;
    out[k] = v.length > 500 ? `${v.slice(0, 500)}…` : v;
  }
  return out;
}
