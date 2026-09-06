'use client';

import { useId, useRef, useState } from 'react';
import { listItems, text } from '../../lib/blocks/items.js';

/**
 * Tabbed panels, built to the WAI-ARIA tabs pattern.
 *
 * Two rules drove every decision here.
 *
 * Keyboard first. The tab strip is a single tab stop (roving tabindex), and
 * Left/Right/Home/End move between tabs, which is what a keyboard user
 * expects and what the ICTD Inclusive Accessibility Guideline 2022 requires
 * via WCAG 2.1. Making each tab its own tab stop would technically "work"
 * and would be wrong.
 *
 * Every panel stays in the document. Inactive panels are marked `hidden`, not
 * unmounted, so the text is in the HTML a crawler receives, Ctrl+F finds it,
 * and printing the page prints all of it. On a page carrying concession terms
 * or a tariff explanation, content that exists only after a click is content
 * that does not exist.
 *
 * Server-rendered, the first panel is open and the rest are `hidden` — so
 * with JavaScript unavailable the reader still gets one panel plus, in the
 * source, everything else.
 */
export default function TabsBlock({ data }) {
  const items = listItems(data.items).filter((item) => text(item.label));
  const [active, setActive] = useState(0);
  const uid = useId();
  const tabs = useRef([]);

  if (items.length === 0) return null;
  const current = active < items.length ? active : 0;

  const move = (event) => {
    const last = items.length - 1;
    let next = null;
    if (event.key === 'ArrowRight') next = current === last ? 0 : current + 1;
    else if (event.key === 'ArrowLeft') next = current === 0 ? last : current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    // Automatic activation: focus follows selection, which is the pattern for
    // panels whose content is already in the document and costs nothing to show.
    tabs.current[next]?.focus();
  };

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <div className="db-tabs">
        <div className="db-tablist" role="tablist" onKeyDown={move}>
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              className="db-tab"
              aria-selected={i === current}
              aria-controls={`${uid}-panel-${i}`}
              tabIndex={i === current ? 0 : -1}
              ref={(node) => { tabs.current[i] = node; }}
              onClick={() => setActive(i)}
            >
              {text(item.label)}
            </button>
          ))}
        </div>
        {items.map((item, i) => (
          <div
            key={i}
            role="tabpanel"
            id={`${uid}-panel-${i}`}
            className="db-tabpanel"
            aria-labelledby={`${uid}-tab-${i}`}
            hidden={i !== current}
            tabIndex={0}
          >
            {/* Sanitised on save: lib/blocks/form.js runs every declared
                `richtext` sub-field of a list row through the same
                sanitizeHtml() as a top-level rich field. */}
            <div className="db-prose" dangerouslySetInnerHTML={{ __html: text(item.body) ? item.body : '' }} />
          </div>
        ))}
      </div>
    </section>
  );
}
