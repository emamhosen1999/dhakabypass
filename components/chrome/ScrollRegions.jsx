'use client';

import { useEffect } from 'react';

/**
 * Sideways-scrolling tables reachable by keyboard (UI audit UI-A11Y-01,
 * WCAG 2.1.1): a `.db-scroll-x` region wider than its box gets tabindex="0",
 * role="region" and a label taken from the table's caption, so a keyboard
 * user can focus it and scroll with the arrow keys, and axe's
 * scrollable-region-focusable rule passes. One that fits gets nothing —
 * an extra tab stop on a table that does not scroll is noise.
 *
 * Also marks the region `data-overflow` so the CSS can show the right-edge
 * fade and the "scroll for more" hint only when there is more (UI-RESP-01).
 * Re-checked on resize and when the DOM changes (a filter hiding rows).
 */
export default function ScrollRegions({ hint = 'Scroll sideways for more' }) {
  useEffect(() => {
    const regions = () => [...document.querySelectorAll('.db-scroll-x')];

    /**
     * The arrow pair ScrollArrows.jsx renders beside a region, hidden. This
     * only reveals it when the region overflows and keeps the two buttons'
     * disabled state honest; the click itself is delegated below. Nothing is
     * inserted into the DOM here — see ScrollArrows.jsx for why.
     */
    const arrowsFor = (el) => {
      const prevSib = el.previousElementSibling;
      if (prevSib && prevSib.classList.contains('db-scroll-arrows')) return prevSib;
      const nextSib = el.nextElementSibling;
      if (nextSib && nextSib.classList.contains('db-scroll-arrows')) return nextSib;
      return null;
    };
    const setEnds = (el) => {
      const atStart = el.scrollLeft <= 4;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.toggleAttribute('data-scrolled', !atStart);
      el.toggleAttribute('data-at-end', atEnd);
      const bar = arrowsFor(el);
      if (bar) {
        const [prevBtn, nextBtn] = [bar.querySelector('[data-dir="-1"]'), bar.querySelector('[data-dir="1"]')];
        if (prevBtn && prevBtn.disabled !== atStart) prevBtn.disabled = atStart;
        if (nextBtn && nextBtn.disabled !== atEnd) nextBtn.disabled = atEnd;
      }
    };

    const apply = () => {
      for (const el of regions()) {
        const overflows = el.scrollWidth > el.clientWidth + 2;
        el.toggleAttribute('data-overflow', overflows);
        // Assign only on change: the MutationObserver below watches `hidden`,
        // and setting an attribute to the value it already has still fires a
        // record — an unconditional write here was an infinite loop.
        const bar = arrowsFor(el);
        if (bar && bar.hidden !== !overflows) bar.hidden = !overflows;
        if (overflows) setEnds(el);
        if (overflows) {
          if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'region');
          if (!el.getAttribute('aria-label')) {
            const caption = el.querySelector('caption, h2, h3')?.textContent?.trim();
            el.setAttribute('aria-label', caption ? `${caption} (${hint})` : hint);
          }
          el.setAttribute('data-hint', hint);
        } else if (el.getAttribute('tabindex') === '0') {
          el.removeAttribute('tabindex');
          el.removeAttribute('role');
          el.removeAttribute('aria-label');
        }
      }
    };
    apply();
    const onScroll = (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !el.classList.contains('db-scroll-x')) return;
      setEnds(el);
    };
    const onClick = (e) => {
      const btn = e.target.closest?.('.db-scroll-arrows .db-scroll-btn');
      if (!btn) return;
      const bar = btn.parentElement;
      const region = [bar.nextElementSibling, bar.previousElementSibling].find((x) => x && x.classList.contains('db-scroll-x'));
      if (!region) return;
      const dir = Number(btn.dataset.dir) || 1;
      region.scrollBy({ left: dir * Math.max(120, region.clientWidth * 0.8), behavior: 'smooth' });
    };
    document.addEventListener('click', onClick);
    window.addEventListener('resize', apply);
    document.addEventListener('scroll', onScroll, true);
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('resize', apply);
      document.removeEventListener('scroll', onScroll, true);
      observer.disconnect();
    };
  }, [hint]);
  return null;
}
