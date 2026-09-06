'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * W1.3 — the minimal rich-text editor.
 *
 * What it is not: a document editor. Headings (h2/h3), bold, italic, links
 * and the two list types are the whole vocabulary, because that is the whole
 * vocabulary `lib/html/sanitize.js` will keep and `.db-prose` will style.
 * Offering a control whose output the sanitiser strips would be worse than
 * offering nothing.
 *
 * Three deliberate choices:
 *
 *  1. No dependency. `package.json` carries very few, and a WYSIWYG library
 *     is the largest thing that could be added to the admin bundle. This is
 *     `document.execCommand` — deprecated, universally implemented, and the
 *     only zero-dependency path. Every command it can emit is already in the
 *     sanitiser's allowlist, so the deprecated API's sloppier output (`<b>`,
 *     `<div>`, `<font>`) is normalised on save rather than guarded here.
 *
 *  2. NOTHING is sanitised in this file. `lib/blocks/form.js` runs
 *     `sanitizeHtml()` on the way into the database — on top-level richtext
 *     fields and, since W1.22, on richtext sub-fields inside a list row.
 *     A second sanitising path in the editor would be a second answer to
 *     "what is allowed", and the two would drift.
 *
 *  3. The editable surface is written with `dangerouslySetInnerHTML` and
 *     React never re-renders it. React owning a contenteditable subtree
 *     destroys the caret on every keystroke; the seed string only changes
 *     when the operator returns from the HTML view, which is the one moment
 *     a full replacement is what they asked for.
 *
 * The seeded content's `db-pending` / `db-legacy` / `db-provisional-inline`
 * classes survive round-tripping: they live inside the HTML, the surface
 * shows them, the source view lets them be edited by hand, and the sanitiser
 * allowlists any `db-` class on save.
 *
 * Two modes, matching ImageField:
 *  - uncontrolled: pass `name`, and the HTML submits from a named textarea
 *  - controlled:   pass `onChange`, and the parent (ListField) serialises it
 */

const escapeAttr = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/**
 * `title` is what a mouse user reads; `label` is the accessible name and the
 * only text a screen reader announces, so it is written out in full.
 */
const COMMANDS = [
  { label: 'Heading 2', glyph: 'H2', command: 'formatBlock', arg: '<h2>' },
  { label: 'Heading 3', glyph: 'H3', command: 'formatBlock', arg: '<h3>' },
  { label: 'Bold', glyph: 'B', command: 'bold', className: 'font-bold' },
  { label: 'Italic', glyph: 'I', command: 'italic', className: 'italic' },
  { label: 'Bulleted list', glyph: '••', command: 'insertUnorderedList' },
  { label: 'Numbered list', glyph: '1.', command: 'insertOrderedList' },
  { label: 'Paragraph', glyph: '¶', command: 'formatBlock', arg: '<p>' },
];

const BTN = 'px-2 py-1 border rounded text-xs bg-white hover:bg-gray-100 disabled:opacity-40';

export default function RichTextField({ name, label, value, onChange, rows = 8 }) {
  const [own, setOwn] = useState(value ?? '');
  const html = onChange ? (value ?? '') : own;
  const set = (next) => {
    if (onChange) onChange(next);
    else setOwn(next);
  };

  // The surface's DOM content. Set once, and again only when the operator
  // leaves the HTML source view — see the note above about the caret.
  const [seed, setSeed] = useState(() => String(value ?? ''));
  const [source, setSource] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');

  const hostRef = useRef(null);
  const rangeRef = useRef(null);
  const linkInputRef = useRef(null);

  const surface = () => hostRef.current?.querySelector('[data-rich-surface="true"]') || null;

  const surfaceHtml = useMemo(() => (
    `<div data-rich-surface="true" contenteditable="true" role="textbox" aria-multiline="true"`
    + ` aria-label="${escapeAttr(label || 'Rich text')}"`
    + ` class="db-prose min-h-[7rem] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600">`
    + `${seed || '<p><br></p>'}</div>`
  ), [seed, label]);

  useEffect(() => {
    if (linkOpen) linkInputRef.current?.focus();
  }, [linkOpen]);

  /** Remember where the caret was before focus moved to the toolbar. */
  function rememberSelection() {
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (sel && sel.rangeCount > 0) rangeRef.current = sel.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const el = surface();
    if (!el) return;
    el.focus();
    const range = rangeRef.current;
    if (!range || !el.contains(range.commonAncestorContainer)) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function run(command, arg) {
    const el = surface();
    if (!el) return;
    restoreSelection();
    try {
      document.execCommand(command, false, arg);
    } catch {
      // execCommand throws in a few locked-down contexts. The operator still
      // has the HTML source view, so degrade rather than break the form.
    }
    set(el.innerHTML);
    rememberSelection();
  }

  function applyLink() {
    const target = href.trim();
    if (target) run('createLink', target);
    setHref('');
    setLinkOpen(false);
  }

  function toggleSource() {
    if (source) {
      // Coming back: the textarea is now the truth, so re-seed the surface.
      setSeed(html);
      setSource(false);
    } else {
      setSource(true);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {label ? <span className="font-medium">{label}</span> : null}

      <div className="border rounded bg-gray-50">
        <div className="flex flex-wrap gap-1 border-b p-1" role="group" aria-label={`${label || 'Rich text'} formatting`}>
          {COMMANDS.map((c) => (
            <button
              key={c.label}
              type="button"
              aria-label={c.label}
              title={c.label}
              disabled={source}
              // Keeps the caret inside the surface when the button is clicked.
              onMouseDown={(e) => { e.preventDefault(); rememberSelection(); }}
              onClick={() => run(c.command, c.arg)}
              className={`${BTN} ${c.className || ''}`}
            >
              <span aria-hidden="true">{c.glyph}</span>
            </button>
          ))}
          <button
            type="button"
            aria-label="Link"
            title="Link"
            aria-expanded={linkOpen}
            disabled={source}
            onMouseDown={(e) => { e.preventDefault(); rememberSelection(); }}
            onClick={() => setLinkOpen((v) => !v)}
            className={BTN}
          >
            <span aria-hidden="true">🔗</span>
          </button>
          <button
            type="button"
            aria-label="Remove link"
            title="Remove link"
            disabled={source}
            onMouseDown={(e) => { e.preventDefault(); rememberSelection(); }}
            onClick={() => run('unlink')}
            className={BTN}
          >
            <span aria-hidden="true">⛌</span>
          </button>
          <button type="button" onClick={toggleSource} className={`${BTN} ml-auto`}>
            {source ? 'Back to formatted view' : 'Edit HTML'}
          </button>
        </div>

        {linkOpen ? (
          <div className="flex flex-wrap gap-2 items-center border-b p-2">
            <label className="text-xs text-gray-600" htmlFor={`${name || label}-link`}>Link target</label>
            <input
              id={`${name || label}-link`}
              ref={linkInputRef}
              type="text"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { e.preventDefault(); setLinkOpen(false); }
              }}
              placeholder="/en/travel/toll or https://…"
              className="flex-1 min-w-0 border rounded px-2 py-1 text-xs"
            />
            <button type="button" onClick={applyLink} className={BTN}>Apply link</button>
          </div>
        ) : null}

        {/* React writes this subtree exactly once per seed — see the header. */}
        <div
          ref={hostRef}
          hidden={source}
          className="bg-white rounded-b"
          onInput={() => { const el = surface(); if (el) set(el.innerHTML); }}
          onBlur={() => { const el = surface(); if (el) set(el.innerHTML); }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: surfaceHtml }}
        />

        {/* The submitted value, and the escape hatch for the seeded db-
            classes. Always in the document so the field still posts its
            current value when JavaScript has not run. */}
        <textarea
          name={name}
          hidden={!source}
          value={html}
          onChange={(e) => set(e.target.value)}
          rows={rows}
          aria-label={`${label || 'Rich text'} HTML source`}
          className="w-full border-0 rounded-b px-3 py-2 font-mono text-xs"
        />
      </div>
    </div>
  );
}
