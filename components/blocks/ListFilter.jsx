'use client';

import { useEffect, useId, useState } from 'react';

/**
 * The shared filter over an already-rendered list (INT.5, INT.3).
 *
 * The rows are on the page before this runs — server-rendered, crawlable,
 * printable, findable with Ctrl+F — and stay in the DOM: filtering only sets
 * `hidden` on the rows whose `data-filter-text` does not contain the query
 * or whose `data-filter-tags` lack a ticked tag. Nothing is fetched, nothing
 * is removed, and with JavaScript off nothing is rendered here at all (the
 * control appears after mount), so a reader without script sees the whole
 * list and no dead search box.
 *
 * `scope` is the id of the element whose descendants carry the data
 * attributes. `tags` is the union of tag values the block found in its rows,
 * rendered as checkboxes; a row must carry EVERY ticked tag ("toilets and a
 * mosque", not "toilets or a mosque"), which is the question a driver asks.
 */
export default function ListFilter({ scope, label, placeholder, tags = [], countLabel }) {
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState('');
  const [ticked, setTicked] = useState([]);
  const [shown, setShown] = useState(null);
  const id = useId();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.getElementById(scope);
    if (!root) return;
    const rows = root.querySelectorAll('[data-filter-text]');
    const needle = q.trim().toLocaleLowerCase();
    let visible = 0;
    rows.forEach((row) => {
      const text = (row.getAttribute('data-filter-text') || '').toLocaleLowerCase();
      const rowTags = (row.getAttribute('data-filter-tags') || '').split('|').filter(Boolean);
      const textOk = !needle || text.includes(needle);
      const tagsOk = ticked.every((t) => rowTags.includes(t));
      const ok = textOk && tagsOk;
      row.hidden = !ok;
      if (ok) visible += 1;
    });
    setShown({ visible, total: rows.length });
  }, [mounted, q, ticked, scope]);

  if (!mounted) return null;

  const toggle = (v) => setTicked((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  return (
    <div className="db-listfilter" role="search">
      <label htmlFor={`${id}-q`} className="db-label">{label}</label>
      <input
        id={`${id}-q`} type="search" className="db-input db-listfilter-input"
        value={q} placeholder={placeholder} onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />
      {tags.length > 0 ? (
        <fieldset className="db-listfilter-tags">
          <legend className="db-listfilter-legend">{tags.length ? tagsLegend(tags) : ''}</legend>
          {tags.map((t) => (
            <label key={t.value} className={`db-tag db-listfilter-tag${ticked.includes(t.value) ? ' is-on' : ''}`}>
              <input type="checkbox" checked={ticked.includes(t.value)} onChange={() => toggle(t.value)} />
              {t.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {shown ? (
        <p className="db-listfilter-count" aria-live="polite">
          {countLabel.replace('{n}', String(shown.visible)).replace('{total}', String(shown.total))}
        </p>
      ) : null}
    </div>
  );
}

// The legend is the first tag's group name if given, else nothing visible;
// blocks pass `legend` through the first tag when they need one.
function tagsLegend(tags) {
  return tags[0].legend || '';
}
