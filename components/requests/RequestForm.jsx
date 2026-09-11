'use client';

import { useActionState } from 'react';
import { MAX_MESSAGE_CHARS } from '../../lib/public-write-policy.js';

/**
 * The service request form: grievance, toll dispute, breakdown, lost & found.
 *
 * A client component only for the pending and result states, like
 * ContactForm. `action` is the Server Action already BOUND to the block's
 * configuration by RequestFormBlock, so nothing about the request's kind or
 * deadline is decided here. `plan` says which fields to render; the server
 * validates against the same plan. Every string is passed in from the server
 * component, which reads them from ui_strings, so nothing here is hardcoded
 * English.
 *
 * On success the form is replaced by the tracking number, in a live region
 * and in a <strong> with a stable id so the visitor can select and copy it.
 */
export default function RequestForm({ action, plan, labels, successNote }) {
  const [state, submit, pending] = useActionState(action, { status: 'idle' });
  const invalid = (field) => state.status === 'invalid' && state.fields.includes(field);

  if (state.status === 'ok') {
    return (
      <div className="db-form-result db-form-ok" role="status">
        <h2 className="db-h3">{labels.sentHeading}</h2>
        <p>{labels.sentBody}</p>
        <p className="db-tracking">
          <span className="db-tracking-label">{labels.trackingLabel}</span>{' '}
          <strong className="db-tracking-no" id="rf-tracking">{state.trackingNo}</strong>
        </p>
        <p className="db-form-note">{labels.keepNumber}</p>
        {successNote ? <p className="db-form-note">{successNote}</p> : null}
      </div>
    );
  }

  const field = (name, label, { type = 'text', required = false, autoComplete } = {}) => (
    <div className="db-field">
      <label htmlFor={`rf-${name}`} className="db-label">
        {label} {required ? <span className="db-required" aria-hidden="true">*</span> : null}
      </label>
      <input
        id={`rf-${name}`} name={name} type={type} required={required} autoComplete={autoComplete}
        className="db-input" aria-invalid={invalid(name) || undefined}
      />
    </div>
  );

  return (
    <form action={submit} className="db-form" noValidate>
      <div aria-live="polite" className="db-form-live">
        {state.status === 'invalid' ? <p className="db-form-error">{labels.errorRequired}</p> : null}
        {state.status === 'unavailable' ? <p className="db-form-error">{labels.errorUnavailable}</p> : null}
        {state.status === 'ratelimited' ? <p className="db-form-error">{labels.errorRateLimited}</p> : null}
        {state.status === 'too_long' ? <p className="db-form-error">{labels.errorTooLong}</p> : null}
      </div>

      {field('name', labels.name, { required: true, autoComplete: 'name' })}
      {plan.phone ? field('phone', labels.phone, { type: 'tel', required: !plan.email, autoComplete: 'tel' }) : null}
      {plan.email ? field('email', labels.email, { type: 'email', required: !plan.phone, autoComplete: 'email' }) : null}
      {plan.phone && plan.email ? <p className="db-form-note">{labels.contactEither}</p> : null}
      {plan.vehicle ? field('vehicle_no', labels.vehicle, { required: true }) : null}
      {plan.location ? field('location', labels.location, { required: true }) : null}
      {field('subject', labels.subject)}

      <div className="db-field">
        <label htmlFor="rf-message" className="db-label">
          {labels.message} <span className="db-required" aria-hidden="true">*</span>
        </label>
        <textarea
          id="rf-message" name="message" rows={7} required maxLength={MAX_MESSAGE_CHARS}
          className="db-input db-textarea" aria-invalid={invalid('message') || undefined}
        />
      </div>

      {/* Honeypot. Hidden from sight and from assistive technology, and
          excluded from tab order, so no person encounters it. */}
      <div className="db-honeypot" aria-hidden="true">
        <label htmlFor="rf-company">{labels.honeypot}</label>
        <input id="rf-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="db-form-note">{labels.privacy}</p>

      <button type="submit" className="db-btn db-btn-primary" disabled={pending}>
        {pending ? labels.sending : labels.send}
      </button>
    </form>
  );
}
