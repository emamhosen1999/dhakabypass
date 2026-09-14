/** Parents before children, children indented under them (audit S2). Pure. */
export function pageTree(pages) {
  const ids = new Set(pages.map((p) => p.id));
  const byParent = new Map();
  for (const p of pages) {
    const key = p.parent_id && ids.has(p.parent_id) ? p.parent_id : 0;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(p);
  }
  const out = [];
  const seen = new Set();
  const walk = (key, depth) => {
    for (const p of (byParent.get(key) || []).sort((a, b) => String(a.slug).localeCompare(String(b.slug)))) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({ ...p, depth });
      walk(p.id, depth + 1);
    }
  };
  walk(0, 0);
  // A parent loop would hide its members; list them flat rather than lose them.
  for (const p of pages) if (!seen.has(p.id)) out.push({ ...p, depth: 0 });
  return out;
}
