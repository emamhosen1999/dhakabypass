'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { undoTrashAction } from '../../app/admin/(dash)/history-actions';
import {
  LAST, TYPED, SKIP_TYPES, labelOf, isDestructive, flashText, questionFor, formKey, typedValues, writeBack,
} from './form-guard';

export { isDestructive, flashText, questionFor } from './form-guard';

/**
 * The behaviour every admin form shares (W7.6, W7.7, W7.8).
 *
 * CONFIRM. A submit that deletes, removes, clears or discards — by its text,
 * aria-label or title — or that carries `data-confirm`, asks first. The
 * question is `data-confirm` when the server wrote one naming the record and
 * what goes with it; otherwise it names the record from the nearest
 * `data-record-label`. `data-noconfirm` opts a button out (an action that is
 * itself reversible, such as "Hide from gallery"). The listener is on
 * `window` in the capture phase, so a cancelled submission never reaches
 * React's form-action handling.
 *
 * FEEDBACK. The button shows `data-pending` ("Deleting…", "Sending…") while
 * the request runs. When the action finishes, runAction's `admin_flash`
 * cookie arrives through the layout: the toast says what the action said
 * (`setFlash`), or the button's `data-flash`, and offers Undo for a delete that
 * went to the trash. A red notice left from an earlier refusal is cleared.
 *
 * KEEP WHAT WAS TYPED. A refused save redirects back with `?notice=`, and the
 * page re-renders its forms from the database, which used to wipe every field
 * the operator had filled in. What was typed is kept for the moment of the
 * submit and written back into the same form when the notice arrives.
 * Passwords and files are never kept.
 *
 * UNSAVED CHANGES. Typing into a form marks it; leaving the page — a link, a
 * language tab, a reload — while any form is marked asks first.
 */
export default function AdminFormGuard({ flash = null }) {
  const [toast, setToast] = useState(null);
  const dirty = useRef(new Set());
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Confirm, pending state, remember the button and what was typed.
  useEffect(() => {
    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if ((form.getAttribute('method') || '').toLowerCase() === 'get') return;
      const button = event.submitter || form.querySelector('button[type="submit"], button:not([type])');
      if (isDestructive(button)) {
        if (process.env.NODE_ENV !== 'production' && !button.hasAttribute('data-confirm') && !button.closest('[data-record-label]')) {
          console.error('Admin: a destructive button without data-confirm or data-record-label', button);
        }
        if (!window.confirm(questionFor(button))) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      }
      dirty.current.delete(form);
      try {
        sessionStorage.setItem(LAST, JSON.stringify({ label: labelOf(button), flash: button?.getAttribute('data-flash') || '' }));
        sessionStorage.setItem(TYPED, JSON.stringify({ path: window.location.pathname, key: formKey(form), values: typedValues(form), at: Date.now() }));
      } catch { /* storage blocked */ }
      if (button && !button.hasAttribute('data-flash-inline')) {
        const original = button.textContent;
        const pending = button.getAttribute('data-pending') || (isDestructive(button) ? 'Deleting…' : 'Saving…');
        setTimeout(() => {
          if (!button.isConnected) return;
          button.setAttribute('aria-busy', 'true');
          if (original && original.trim().length < 40) button.textContent = pending;
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

  // A refusal: put back what was typed. A success: forget it.
  const notice = params.get('notice') ? `${params.get('notice')}|${params.get('nt') || ''}` : '';
  useEffect(() => {
    let stash = null;
    try { stash = JSON.parse(sessionStorage.getItem(TYPED) || 'null'); } catch { stash = null; }
    if (!stash) return;
    if (!notice) {
      if (flash) { try { sessionStorage.removeItem(TYPED); } catch { /* storage blocked */ } }
      return;
    }
    if (stash.path !== window.location.pathname || Date.now() - Number(stash.at || 0) > 120000) return;
    // The redirect is a soft navigation: the new form elements arrive a
    // moment after the URL changes, and React 19 resets the old ones. Keep
    // writing the values back until they stay put, then let go.
    let tries = 0;
    let scrolled = false;
    const apply = () => {
      const form = [...document.querySelectorAll('form')].find((f) => formKey(f) === stash.key);
      if (form) {
        writeBack(form, stash.values);
        dirty.current.add(form);
        if (!scrolled) {
          scrolled = true;
          form.querySelector('input:not([type="hidden"]), select, textarea')?.scrollIntoView({ block: 'center' });
        }
      }
      tries += 1;
      if (tries >= 8) {
        clearInterval(timer);
        try { sessionStorage.removeItem(TYPED); } catch { /* storage blocked */ }
      }
    };
    apply();
    const timer = setInterval(apply, 250);
    return () => clearInterval(timer);
  }, [notice, flash]);

  // The toast, with Undo when the action put something in the trash.
  useEffect(() => {
    if (!flash) return undefined;
    let last = {};
    try { last = JSON.parse(sessionStorage.getItem(LAST) || '{}'); sessionStorage.removeItem(LAST); } catch { last = {}; }
    document.cookie = 'admin_flash=; Max-Age=0; path=/';
    document.querySelectorAll('button[aria-busy="true"]').forEach((b) => b.removeAttribute('aria-busy'));
    setToast({ text: flash.t || flashText(last.label, last.flash), undo: flash.u || null });
    // A red notice from an earlier refusal no longer applies.
    if (new URLSearchParams(window.location.search).has('notice')) {
      const next = new URLSearchParams(window.location.search);
      next.delete('notice');
      next.delete('nt');
      const qs = next.toString();
      router.replace(qs ? `${window.location.pathname}?${qs}` : window.location.pathname, { scroll: false });
    }
    const timer = setTimeout(() => setToast(null), flash.u ? 15000 : 4000);
    return () => clearTimeout(timer);
  }, [flash, router]);

  // Unsaved changes.
  useEffect(() => {
    const mark = (event) => {
      const el = event.target;
      const form = el?.form || el?.closest?.('form');
      if (!form || !el.name || SKIP_TYPES.has(el.type)) return;
      if ((form.getAttribute('method') || '').toLowerCase() === 'get' || form.hasAttribute('data-nodirty')) return;
      if (!event.isTrusted) return;
      dirty.current.add(form);
    };
    const pendingForms = () => [...dirty.current].filter((f) => f.isConnected);
    const onBeforeUnload = (event) => {
      if (!pendingForms().length) return;
      event.preventDefault();
      event.returnValue = '';
    };
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const a = event.target?.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const forms = pendingForms();
      if (!forms.length) return;
      const names = forms.map((f) => f.closest('[data-record-label]')?.getAttribute('data-record-label')).filter(Boolean);
      const where = names.length ? ` in ${names.slice(0, 3).join(', ')}${names.length > 3 ? ' and others' : ''}` : '';
      if (!window.confirm(`You have unsaved changes${where}. Leave this page without saving them?`)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        dirty.current.clear();
      }
    };
    document.addEventListener('input', mark, true);
    document.addEventListener('change', mark, true);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('input', mark, true);
      document.removeEventListener('change', mark, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  useEffect(() => { dirty.current.clear(); }, [pathname]);

  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 flex max-w-md items-center gap-3 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900 shadow">
      <span className="min-w-0 break-words">{toast.text}</span>
      {toast.undo ? (
        <form action={undoTrashAction}>
          <input type="hidden" name="id" value={toast.undo} />
          <button type="submit" data-noconfirm="" data-flash="Restored." data-pending="Restoring…" className="rounded border border-green-800 bg-white px-2 py-0.5 text-green-900 hover:bg-green-100">
            Undo
          </button>
        </form>
      ) : null}
      <button type="button" aria-label="Dismiss" onClick={() => setToast(null)} className="rounded px-1 text-green-900 hover:bg-green-100">×</button>
    </div>
  );
}
