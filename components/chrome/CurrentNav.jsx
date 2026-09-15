'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Marks the header link for the section the reader is in with aria-current
 * (UI audit UI-NAV-02). Done in the browser so the header stays one cached
 * render for every page; without script no link is marked, which is honest.
 */
export default function CurrentNav() {
  const pathname = usePathname() || '';
  useEffect(() => {
    const strip = (p) => String(p || '').replace(/^\/(en|bn|zh)(?=\/|$)/, '').replace(/\/+$/, '') || '/';
    const here = strip(pathname);
    for (const a of document.querySelectorAll('.db-nav a, .db-nav-mobile a')) {
      const target = strip(a.getAttribute('href'));
      const current = target === '/' ? here === '/' : here === target || here.startsWith(`${target}/`);
      if (current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }, [pathname]);
  return null;
}
