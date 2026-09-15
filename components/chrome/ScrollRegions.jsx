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
    const apply = () => {
      for (const el of regions()) {
        const overflows = el.scrollWidth > el.clientWidth + 2;
        el.toggleAttribute('data-overflow', overflows);
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
      el.toggleAttribute('data-scrolled', el.scrollLeft > 4);
      el.toggleAttribute('data-at-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    window.addEventListener('resize', apply);
    document.addEventListener('scroll', onScroll, true);
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    return () => {
      window.removeEventListener('resize', apply);
      document.removeEventListener('scroll', onScroll, true);
      observer.disconnect();
    };
  }, [hint]);
  return null;
}
