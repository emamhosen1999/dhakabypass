'use client';

import { useActionState } from 'react';
import { subscribeNewsletter } from '../../lib/newsletter/actions.js';

/**
 * The email sign-up. A client component only for the pending and result
 * states; every string arrives from the server component, which read it
 * from ui_strings or the block's own fields.
 */
export default function NewsletterSignup({ labels }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, { status: 'idle' });

  if (state.status === 'ok') {
    return (
      <div className="db-form-result db-form-ok" role="status">
        <p>{labels.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="db-form db-newsletter-form" noValidate>
      <div aria-live="polite" className="db-form-live">
        {state.status === 'invalid' ? <p className="db-form-error">{labels.invalid}</p> : null}
        {state.status === 'unavailable' ? <p className="db-form-error">{labels.unavailable}</p> : null}
        {state.status === 'ratelimited' ? <p className="db-form-error">{labels.rateLimited}</p> : null}
      </div>
      <div className="db-newsletter-row">
        <div className="db-field db-newsletter-field">
          <label htmlFor="nl-email" className="db-label">{labels.email}</label>
          <input
            id="nl-email" name="email" type="email" required autoComplete="email" inputMode="email"
            className="db-input" aria-invalid={state.status === 'invalid' || undefined}
          />
        </div>
        <button type="submit" className="db-btn db-btn-primary" disabled={pending}>
          {pending ? labels.sending : labels.button}
        </button>
      </div>
      <div className="db-honeypot" aria-hidden="true">
        <label htmlFor="nl-company">{labels.honeypot}</label>
        <input id="nl-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="db-form-note">{labels.note}</p>
    </form>
  );
}
