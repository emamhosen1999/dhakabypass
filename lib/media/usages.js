import { referencesMediaPath } from './references.js';

/**
 * Everywhere a picture is shown (audit M1): page blocks, page sharing images,
 * news banners, site settings (logo, favicon, sharing image), per-route search
 * settings and camera still images.
 *
 * `pageSlugsUsingMedia` covered only the first two, so a news banner or the
 * site logo could be removed from the library and break on the public site.
 * This reads each source once and answers for many paths at a time, which is
 * what the library screen needs.
 *
 * Takes `q(sql, params)` so it runs inside a transaction or a test.
 */
export async function mediaUsageMap(q, paths) {
  const wanted = [...new Set((paths || []).filter((p) => typeof p === 'string' && p))];
  const out = new Map(wanted.map((p) => [p, { pages: [], news: [], settings: [], routes: [], cameras: [] }]));
  if (!wanted.length) return out;
  const add = (path, kind, name) => {
    const u = out.get(path);
    if (u && !u[kind].includes(name)) u[kind].push(name);
  };
  const parse = (v) => {
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return v; }
  };

  const [blocks, og, news, settings, routes, cameras] = await Promise.all([
    q(`SELECT bt.data, p.slug FROM block_translations bt JOIN blocks b ON b.id = bt.block_id JOIN pages p ON p.id = b.page_id`),
    q(`SELECT pt.og_image, p.slug FROM page_translations pt JOIN pages p ON p.id = pt.page_id WHERE pt.og_image <> ''`),
    q(`SELECT title, image FROM news_updates WHERE image IS NOT NULL AND image <> ''`),
    q(`SELECT setting_key, value FROM site_settings`),
    q(`SELECT route, og_image FROM route_meta WHERE og_image IS NOT NULL AND og_image <> ''`).catch(() => []),
    q(`SELECT names, snapshot_url FROM cameras WHERE snapshot_url LIKE '/%'`).catch(() => []),
  ]);

  for (const row of blocks || []) {
    const text = typeof row.data === 'string' ? row.data : JSON.stringify(row.data);
    for (const path of wanted) {
      if (text.includes(path) && referencesMediaPath(parse(row.data), path)) add(path, 'pages', row.slug);
    }
  }
  for (const row of og || []) if (out.has(row.og_image)) add(row.og_image, 'pages', row.slug);
  for (const row of news || []) if (out.has(row.image)) add(row.image, 'news', row.title);
  for (const row of settings || []) {
    const text = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
    for (const path of wanted) if (text.includes(`"${path}"`) || text === path) add(path, 'settings', row.setting_key);
  }
  for (const row of routes || []) if (out.has(row.og_image)) add(row.og_image, 'routes', row.route);
  for (const row of cameras || []) {
    if (!out.has(row.snapshot_url)) continue;
    const names = parse(row.names);
    add(row.snapshot_url, 'cameras', (names && names.en) || 'camera');
  }
  return out;
}

export async function mediaUsages(q, path) {
  return (await mediaUsageMap(q, [path])).get(path) || { pages: [], news: [], settings: [], routes: [], cameras: [] };
}

export function usageCount(u) {
  return u ? u.pages.length + u.news.length + u.settings.length + u.routes.length + u.cameras.length : 0;
}

/** "the pages /home and /about, the article "Opening day" and the site setting seo.og_image" */
export function describeUsage(u) {
  if (!u) return '';
  const parts = [];
  if (u.pages.length) parts.push(`${u.pages.length === 1 ? 'the page' : 'the pages'} ${u.pages.map((s) => `/${s}`).join(', ')}`);
  if (u.news.length) parts.push(`${u.news.length === 1 ? 'the article' : 'the articles'} ${u.news.map((t) => `"${t}"`).join(', ')}`);
  if (u.settings.length) parts.push(`the site setting${u.settings.length === 1 ? '' : 's'} ${u.settings.join(', ')}`);
  if (u.routes.length) parts.push(`the search settings for ${u.routes.join(', ')}`);
  if (u.cameras.length) parts.push(`the camera${u.cameras.length === 1 ? '' : 's'} ${u.cameras.join(', ')}`);
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
