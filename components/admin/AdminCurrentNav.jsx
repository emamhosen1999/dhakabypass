'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** aria-current on the admin screen being viewed (UI audit UI-ADM-05). */
export default function AdminCurrentNav() {
  const pathname = usePathname() || '';
  useEffect(() => {
    for (const a of document.querySelectorAll('.db-admin-nav a')) {
      const href = a.getAttribute('href') || '';
      const current = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
      if (current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }, [pathname]);
  return null;
}
