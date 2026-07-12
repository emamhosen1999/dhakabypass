'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

/**
 * Fixed site header. Markup mirrors the original site exactly (captured from the
 * live render, since the original layout was a client component and therefore
 * absent from the static export). Content is admin-editable via `site.header`.
 */
export default function SiteHeader({ content }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const {
    logo,
    brandName,
    brandTagline,
    navLinks = [],
    ctaLabel,
    ctaHref,
    translateHref,
    translateIcon,
  } = content || {};

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img alt="DBEDC Logo" className="w-16 h-16 object-cover" src={logo} />
            <div className="ml-3">
              <div className="text-xl font-bold text-blue-900">{brandName}</div>
              <div className="text-sm text-gray-600 -mt-1">{brandTagline}</div>
            </div>
          </Link>

          {/* Desktop nav: single-line, never wrapping. Shown from xl so it can
              never cram at mid widths (the original overflowed by ~115px at
              1440px and wrapped 4 labels onto two lines). */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className={
                    isActive(link.href)
                      ? 'block px-2.5 py-2 rounded-md transition-all font-semibold text-[15px] whitespace-nowrap text-blue-900 bg-blue-50'
                      : 'block px-2.5 py-2 rounded-md transition-all font-semibold text-[15px] whitespace-nowrap text-gray-700 hover:text-blue-900 hover:bg-blue-50/50'
                  }
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute -bottom-0.5 left-2.5 right-2.5 h-0.5 bg-orange-500" />
                  )}
                </Link>
              </div>
            ))}
            <Link
              href={ctaHref || '/contact'}
              className="ml-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-all font-semibold text-[15px] whitespace-nowrap shadow-sm hover:shadow"
            >
              {ctaLabel}
            </Link>
            {translateHref && (
              <a
                href={translateHref}
                rel="noopener noreferrer"
                className="ml-2 shrink-0 hover:shadow"
              >
                <img alt="Language Toggle" width={32} height={32} src={translateIcon} />
              </a>
            )}
          </nav>

          <button
            className="xl:hidden text-gray-700 focus:outline-none"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" style={{ top: '64px' }}>
          <div className="fixed inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white h-full w-4/5 max-w-sm overflow-y-auto shadow-xl p-6 flex flex-col">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <div key={link.href} className="border-b border-gray-100 pb-3">
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={
                      isActive(link.href)
                        ? 'block py-2 font-semibold text-blue-900'
                        : 'block py-2 font-semibold text-gray-700'
                    }
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Link
                href={ctaHref || '/contact'}
                onClick={() => setMenuOpen(false)}
                className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-center rounded-md transition-all font-semibold"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
