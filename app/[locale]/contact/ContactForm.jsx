'use client';

import { useActionState } from 'react';
import { submitContactMessage } from './actions.js';

/**
 * The contact form.
 *
 * A client component only because it needs the pending and result states —
 * everything else on the page is server-rendered. Every string is passed in
 * from the server component, which reads them from lib/i18n/ui.js, so nothing
 * here is hardcoded English.
 *
 * The outcome is announced in an aria-live region rather than only shown: on a
 * successful send the form is replaced, and without the live region a screen
 * reader user gets no indication that anything happened at all.
 */
export default function ContactForm({ labels }) {
  const [state, action, pending] = useActionState(submitContactMessage, { status: 'idle' });

  const invalid = (field) => state.status === 'invalid' && state.fields.includes(field);

  if (state.status === 'ok') {
    return (
      <div className="db-form-result db-form-ok" role="status">
        <h2 className="db-h3">{labels.sentHeading}</h2>
        <p>{labels.sentBody}</p>
      </div>
    );
  }

  return (
    <form action={action} className="db-form" noValidate>
      {/* Announced to assistive technology when it appears, not merely shown. */}
      <div aria-live="polite" className="db-form-live">
        {state.status === 'invalid' ? (
          <p className="db-form-error">{labels.errorRequired}</p>
        ) : null}
        {state.status === 'unavailable' ? (
          <p className="db-form-error">{labels.errorUnavailable}</p>
        ) : null}
      </div>

      <div className="db-field">
        <label htmlFor="cf-name" className="db-label">
          {labels.name} <span className="db-required" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-name" name="name" type="text" required autoComplete="name"
          className="db-input" aria-invalid={invalid('name') || undefined}
        />
      </div>

      <div className="db-field">
        <label htmlFor="cf-email" className="db-label">
          {labels.email} <span className="db-required" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-email" name="email" type="email" required autoComplete="email"
          className="db-input" aria-invalid={invalid('email') || undefined}
        />
      </div>

      <div className="db-field">
        <label htmlFor="cf-subject" className="db-label">{labels.subject}</label>
        <input
          id="cf-subject" name="subject" type="text" className="db-input"
        />
      </div>

      <div className="db-field">
        <label htmlFor="cf-message" className="db-label">
          {labels.message} <span className="db-required" aria-hidden="true">*</span>
        </label>
        <textarea
          id="cf-message" name="message" rows={7} required
          className="db-input db-textarea" aria-invalid={invalid('message') || undefined}
        />
      </div>

      {/* Honeypot. Hidden from sight and from assistive technology, and excluded
          from tab order, so no person encounters it. */}
      <div className="db-honeypot" aria-hidden="true">
        <label htmlFor="cf-company">{labels.honeypot}</label>
        <input id="cf-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="db-form-note">{labels.privacy}</p>

      <button type="submit" className="db-btn db-btn-primary" disabled={pending}>
        {pending ? labels.sending : labels.send}
      </button>
    </form>
  );
}
