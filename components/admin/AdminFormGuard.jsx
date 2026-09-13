'use client';

import { useEffect, useState } from 'react';

/**
 * Confirmation before anything destructive, and feedback after every save,
 * on every admin form (reported 13 Sep 2026: interchanges were deleted by a
 * single click with no question asked, and a save gave no sign it worked).
 *
 * CONFIRM. A submit whose button says Delete, Remove, Clear or Discard — in
 * its text, aria-label or title — or carries `data-confirm`, asks first. The
 * listener is on `window` in the capture phase, so a cancelled submission is
 * stopped before React's form-action handling ever sees it: nothing is sent.
 *
 * FEEDBACK. The submitting button shows "Saving…" while the request runs.
 * When the action finishes, lib/admin/run-action.js sets a short-lived
 * `admin_flash` cookie and the dash layout passes it here, which shows
 * "Saved.", "Published." or "Deleted." for the button that was pressed.
 * A failure still arrives as the red notice from AdminNotice.
 */
const DESTRUCTIVE = /\b(delete|remove|clear|discard|reset to built-in|use the built-in)\b/i;
const LAST = 'admin:last-submit';

function labelOf(button) {
  if (!button) return '';
  return (button.getAttribute('data-confirm') || button.getAttribute('aria-label') || button.getAttribute('title')
    || button.textContent || '').trim();
}

export function isDestructive(button) {
  return Boolean(button) && (button.hasAttribute('data-confirm') || DESTRUCTIVE.test(labelOf(button)));
}

export function flashText(label) {
  if (DESTRUCTIVE.test(label || '')) return 'Deleted.';
  if (/publish/i.test(label || '')) return 'Published.';
  return 'Saved.';
}

export default function AdminFormGuard({ flash = false }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onSubmit = (event) => {
      const button = event.submitter || event.target.querySelector('button[type="submit"], button:not([type])');
      if (isDestructive(button)) {
        const label = labelOf(button);
        const question = button.getAttribute('data-confirm')
          || `${label || 'Delete this'}?\n\nThis cannot be undone from the admin.`;
        if (!window.confirm(question)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      }
      try { sessionStorage.setItem(LAST, labelOf(button)); } catch { /* storage blocked */ }
      if (button) {
        const original = button.textContent;
        // After the browser has captured the submitter's name/value.
        setTimeout(() => {
          if (!button.isConnected) return;
          button.setAttribute('aria-busy', 'true');
          if (original && original.trim().length < 40) button.textContent = 'Saving…';
          setTimeout(() => {
            if (button.isConnected && button.getAttribute('aria-busy') === 'true') {
              button.removeAttribute('aria-busy');
              button.textContent = original;
            }
          }, 15000);
        }, 0);
      }
    };
    window.addEventListener('submit', onSubmit, true);
    return () => window.removeEventListener('submit', onSubmit, true);
  }, []);

  useEffect(() => {
    if (!flash) return undefined;
    let label = '';
    try { label = sessionStorage.getItem(LAST) || ''; sessionStorage.removeItem(LAST); } catch { /* storage blocked */ }
    document.cookie = 'admin_flash=; Max-Age=0; path=/';
    document.querySelectorAll('button[aria-busy="true"]').forEach((b) => b.removeAttribute('aria-busy'));
    setMessage(flashText(label));
    const timer = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900 shadow">
      {message}
    </div>
  );
}
