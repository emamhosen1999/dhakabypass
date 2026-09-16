'use client';

import { useEffect, useRef } from 'react';

/**
 * The footer link map, collapsed on a phone (W8N.5, NAV-FOOTER-01).
 *
 * The map is 2,109px tall at 320px — more than two screens of undifferentiated
 * list under every page on the site. Collapsing it is not a reason to publish
 * fewer links: a landowner looking for the land-acquisition register and a
 * supplier looking for the tender notices both find them here, and this is the
 * one place they are listed.
 *
 * So the groups are native <details> rendered OPEN by the server. With no
 * script — a crawler, a reader who blocks it, the print stylesheet — the footer
 * is exactly the complete list it has always been. This component closes them
 * below 600px and opens them again above, which is the only thing script is
 * used for. <details> also brings its own keyboard behaviour and its own
 * announcement, so there is no ARIA to get wrong.
 *
 * A group a reader opened themselves is left alone: `data-touched` is set on
 * the first toggle and this never overrides it again while the page lives.
 */
export default function FooterGroups({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const groups = () => [...root.querySelectorAll('details.db-footer-group')];
    const apply = (narrow) => {
      for (const d of groups()) {
        if (d.dataset.touched === 'yes') continue;
        d.open = !narrow;
      }
    };
    const mq = window.matchMedia('(max-width: 599px)');
    const onChange = () => apply(mq.matches);
    const onToggle = (event) => {
      const d = event.target.closest?.('details.db-footer-group');
      if (d) d.dataset.touched = 'yes';
    };
    onChange();
    mq.addEventListener('change', onChange);
    root.addEventListener('toggle', onToggle, true);
    return () => {
      mq.removeEventListener('change', onChange);
      root.removeEventListener('toggle', onToggle, true);
    };
  }, []);

  return <div className="db-footer-groups" ref={ref}>{children}</div>;
}
