'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The draft preview pane, alongside the block editor.
 *
 * The iframe loads `/{locale}/preview/{pageId}` — a route inside the PUBLIC
 * tree, so it inherits app/[locale]/layout.jsx and renders through
 * BlockRenderer exactly as the live page does, chrome, tokens and all. That
 * route is session-gated; nothing here is what keeps drafts private.
 *
 * Widths are real device widths rendered at full size and scaled down to fit
 * the column, rather than a narrow iframe: a 390px-wide viewport must trigger
 * the site's actual mobile breakpoints, which a squeezed 320px frame at
 * desktop width would not.
 */
const WIDTHS = [
  { key: 'mobile', label: 'Mobile', width: 390 },
  { key: 'tablet', label: 'Tablet', width: 768 },
  { key: 'desktop', label: 'Desktop', width: 1280 },
];

const FRAME_HEIGHT = 900;

export default function PreviewPane({ pageId, locale, locales, localeLabels }) {
  const [device, setDevice] = useState('desktop');
  const [previewLocale, setPreviewLocale] = useState(locale);
  const [nonce, setNonce] = useState(0);
  const [boxWidth, setBoxWidth] = useState(0);
  const boxRef = useRef(null);

  // The editing locale is the source of truth: switching the editor's language
  // tabs should move the preview with it.
  const [seenLocale, setSeenLocale] = useState(locale);
  if (seenLocale !== locale) {
    setSeenLocale(locale);
    setPreviewLocale(locale);
  }

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    setBoxWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setBoxWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selected = WIDTHS.find((w) => w.key === device) || WIDTHS[2];
  const scale = boxWidth > 0 ? Math.min(1, boxWidth / selected.width) : 1;
  const src = `/${previewLocale}/preview/${pageId}?v=${nonce}`;

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return (
    <section className="border rounded bg-white" aria-label="Page preview">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-2">
        <h2 className="font-semibold text-sm">Preview</h2>

        <div className="flex gap-1" role="group" aria-label="Preview language">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setPreviewLocale(l)}
              aria-pressed={l === previewLocale}
              className={`px-2 py-1 rounded text-xs ${l === previewLocale ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {localeLabels[l]}
            </button>
          ))}
        </div>

        <div className="flex gap-1" role="group" aria-label="Preview width">
          {WIDTHS.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => setDevice(w.key)}
              aria-pressed={w.key === device}
              className={`px-2 py-1 rounded text-xs ${w.key === device ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {w.label} <span className="text-[10px] opacity-70">{w.width}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={refresh} className="px-2 py-1 border rounded text-xs">
            Refresh
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 border rounded text-xs"
          >
            Open ↗
          </a>
        </div>
      </header>

      <p className="px-3 py-2 text-xs text-gray-500 border-b">
        Shows unpublished drafts as they would render. Save a block, then Refresh.
      </p>

      <div
        ref={boxRef}
        className="overflow-hidden bg-white"
        style={{ height: Math.round(FRAME_HEIGHT * scale) }}
      >
        <iframe
          key={`${previewLocale}:${nonce}`}
          src={src}
          title={`Draft preview, ${localeLabels[previewLocale] || previewLocale}, ${selected.label}`}
          style={{
            width: selected.width,
            height: FRAME_HEIGHT,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </section>
  );
}
