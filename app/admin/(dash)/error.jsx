'use client';

import { useEffect } from 'react';
import { operatorMessage } from '../../../lib/errors';

/**
 * The admin's error boundary.
 *
 * Without this file, an error that escaped a Server Action fell through to
 * Next's own 500 page. Validation messages no longer reach here at all —
 * lib/admin/run-action.js turns them into a redirect with `?notice=` — so
 * what arrives is a genuine fault: a render error, a bug, an action outside
 * runAction. In `next dev` the marker digest may still carry a sentence and
 * is shown; in production Next replaces the digest, the generic line shows,
 * and the error is logged for the console.
 */
export default function AdminError({ error, reset }) {
  const message = operatorMessage(error);
  useEffect(() => {
    if (!message) console.error(error);
  }, [error, message]);

  return (
    <div className="max-w-xl mx-auto mt-16 bg-white rounded-lg border border-red-200 p-8 shadow-sm">
      <h1 className="text-xl font-bold text-red-800">{message ? 'That could not be saved' : 'Something went wrong'}</h1>
      <p className="mt-3 text-gray-800">
        {message || 'The change was not made. Try again; if it keeps happening, tell the developer what you were doing.'}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => (typeof window !== 'undefined' ? window.history.back() : reset())}
          className="px-4 py-2 rounded-md bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800"
        >
          Go back
        </button>
        <button type="button" onClick={() => reset()} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-semibold hover:bg-gray-100">
          Try again
        </button>
      </div>
    </div>
  );
}
