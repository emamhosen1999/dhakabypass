'use client';

import { useActionState, useEffect, useRef } from 'react';
import { undoTrashAction } from '../../app/admin/(dash)/history-actions';

/**
 * A corridor form whose outcome lands beside it (useActionState).
 *
 * React resets an uncontrolled form when its action completes, which used to
 * clear a mistyped latitude or a 400-line coordinate paste along with the
 * error (audit F2). What was typed is captured at submit and written back when
 * the save is refused. A delete that went to the trash offers Undo.
 */
export default function TrafficForm({ action, children, submitLabel = 'Save', className = '', danger = false, confirm = '' }) {
  const [state, submit, pending] = useActionState(action, {});
  const formRef = useRef(null);
  const typed = useRef(null);

  // The confirmation itself is AdminFormGuard's (it runs first, in the capture
  // phase, and stops a cancelled submit before this handler sees it).
  const onSubmit = () => {
    const form = formRef.current;
    if (!form) return;
    typed.current = [...form.elements]
      .filter((el) => el.name && !['hidden', 'file', 'password', 'submit', 'button'].includes(el.type))
      .map((el) => ({ name: el.name, type: el.type, value: el.value, checked: el.checked }));
  };

  useEffect(() => {
    if (!state?.error || !typed.current || !formRef.current) return;
    const els = [...formRef.current.elements];
    for (const saved of typed.current) {
      const el = els.find((e) => e.name === saved.name && (saved.type !== 'radio' || e.value === saved.value));
      if (!el) continue;
      if (saved.type === 'checkbox' || saved.type === 'radio') el.checked = saved.checked;
      else el.value = saved.value;
    }
  }, [state]);

  useEffect(() => {
    if (state?.message && !state?.error) typed.current = null;
  }, [state]);

  return (
    <>
      <form ref={formRef} action={submit} onSubmit={onSubmit} className={`space-y-3 ${className}`}>
        {children}
        <button
          disabled={pending}
          type="submit"
          data-confirm={confirm || undefined}
          data-noconfirm={danger ? undefined : ''}
          data-flash-inline=""
          className={`rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${danger ? 'bg-red-800' : 'bg-blue-900'}`}>
          {pending ? (danger ? 'Deleting…' : 'Saving…') : submitLabel}
        </button>
        {state.error ? <p role="alert" className="text-sm text-red-800">{state.error}</p> : null}
        {state.message && !state.error ? <p role="status" className="text-sm text-green-800">{state.message}</p> : null}
      </form>
      {state.undo && !state.error ? (
        <form action={undoTrashAction} className="mt-2">
          <input type="hidden" name="id" value={state.undo} />
          <button type="submit" data-noconfirm="" data-flash="Restored." className="rounded border border-blue-900 px-3 py-1 text-sm font-semibold text-blue-900">Undo</button>
        </form>
      ) : null}
    </>
  );
}
