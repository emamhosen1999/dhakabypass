'use client';

import { useEffect, useState } from 'react';

/**
 * Working section tabs.
 *
 * The original site rendered this tab bar but never wired it up — clicking a tab
 * only changed its highlight, the content never moved. These tabs actually jump
 * to their section and track the active one while scrolling.
 *
 * `tabs` is [{ label, targetId }]; labels stay admin-editable via page content.
 */
export default function SectionTabs({ tabs = [], variant = 'hero' }) {
  const [active, setActive] = useState(tabs[0]?.targetId);

  useEffect(() => {
    const ids = tabs.map((t) => t.targetId).filter(Boolean);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // account for the fixed 80px header
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [tabs]);

  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const underline = variant === 'underline';

  const classFor = (isActive) => {
    if (underline) {
      return isActive
        ? 'py-4 px-6 font-medium text-sm whitespace-nowrap transition duration-200 border-b-2 border-blue-900 text-blue-900'
        : 'py-4 px-6 font-medium text-sm whitespace-nowrap transition duration-200 border-b-2 border-transparent text-gray-500 hover:text-gray-700';
    }
    return isActive
      ? 'px-6 py-3 rounded-md transition-all bg-orange-500 text-white'
      : 'px-6 py-3 rounded-md transition-all bg-white/10 text-white hover:bg-white/20';
  };

  return (
    <div
      className={
        underline
          ? 'flex justify-center overflow-x-auto'
          : 'flex flex-wrap justify-center gap-4'
      }
    >
      {tabs.map((tab) => {
        const isActive = active === tab.targetId;
        return (
          <button
            key={tab.targetId}
            type="button"
            onClick={() => go(tab.targetId)}
            aria-current={isActive ? 'true' : undefined}
            className={classFor(isActive)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
