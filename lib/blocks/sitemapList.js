/**
 * How the `sitemap-list` block arranges published pages.
 *
 * Pure, so the grouping rule is testable without a database or a renderer.
 *
 * @param pages   `[{ slug, title, href }]` from listSiteIndex(), already in
 *                nav order
 * @param grouped false = one flat list in the given order
 *
 * Grouped: a page whose slug has a first segment matching another page's
 * whole slug — `travel/toll` under `travel` — is a child of that page, which
 * becomes the group's linked heading. A first segment with no such page —
 * `about/partners` when there is no `about` page — still groups, under a
 * plain heading made from the segment, so siblings stay together. Top-level
 * pages with no children form the first group, unheaded, with the home page
 * first because it is first in the operator's order.
 *
 * @param labelFor `(segment) => translated heading | ''` — the component
 *                 passes the ui_strings lookup so a parentless section like
 *                 `travel` is headed "ভ্রমণ তথ্য" on /bn, not "Travel".
 */
export function groupSiteIndex(pages, grouped = true, labelFor = () => '') {
  const rows = (Array.isArray(pages) ? pages : []).filter((p) => p && p.href && p.title);
  if (rows.length === 0) return [];
  if (!grouped) {
    return [{ key: 'all', heading: '', href: '', links: rows.map(link) }];
  }

  const bySlug = new Map(rows.map((p) => [String(p.slug || ''), p]));
  const top = { key: 'top', heading: '', href: '', links: [] };
  const sections = new Map();

  for (const p of rows) {
    const slug = String(p.slug || '');
    const cut = slug.indexOf('/');
    if (cut === -1) {
      // A top-level page that is a section parent is rendered as its
      // section's heading, not as a loose link as well.
      const isParent = rows.some((q) => String(q.slug || '').startsWith(`${slug}/`));
      if (!isParent) top.links.push(link(p));
      continue;
    }
    const first = slug.slice(0, cut);
    let section = sections.get(first);
    if (!section) {
      const parent = bySlug.get(first);
      section = {
        key: first,
        // Never a humanised slug on a public page (audit 1.8): the parent's
        // title, the navigation string, or — failing both — the first child
        // page's own translated title.
        heading: parent ? parent.title : (labelFor(first) || p.title),
        href: parent ? parent.href : '',
        links: [],
      };
      sections.set(first, section);
    }
    section.links.push(link(p));
  }

  const out = [];
  if (top.links.length) out.push(top);
  out.push(...sections.values());
  return out;
}

const link = (p) => ({ href: p.href, title: p.title });
