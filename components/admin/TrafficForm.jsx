'use client';

import { useActionState } from 'react';

export default function TrafficForm({ action, children, submitLabel = 'Save', className = '', danger = false }) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className={`space-y-3 ${className}`}>
      {children}
      <button disabled={pending} type="submit" className={`rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${danger ? 'bg-red-800' : 'bg-blue-900'}`}>
        {pending ? 'Saving…' : submitLabel}
      </button>
      {state.error ? <p role="alert" className="text-sm text-red-800">{state.error}</p> : null}
      {state.message ? <p role="status" className="text-sm text-green-800">{state.message}</p> : null}
    </form>
  );
}
