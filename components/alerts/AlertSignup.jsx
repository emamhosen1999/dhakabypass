'use client';

import { useActionState, useState } from 'react';
import { alertSignup } from '../../lib/alerts/actions.js';

/** Mobile alert sign-up (SMS or WhatsApp), with unsubscribe on the same form. */
export default function AlertSignup({ labels, locale, blockId }) {
  const [state, action, pending] = useActionState(alertSignup, { status: 'idle' });
  const [mode, setMode] = useState('subscribe');
  const id = (f) => `alert-${blockId}-${f}`;

  if (state.status === 'ok' || state.status === 'unsubscribed') {
    return <div className="db-form-result db-form-ok" role="status"><p>{state.status === 'ok' ? labels.ok : labels.unsubscribed}</p></div>;
  }
  return (
    <form action={action} className="db-form db-alert-form" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="mode" value={mode} />
      <div aria-live="polite" className="db-form-live">
        {state.status === 'invalid' ? <p className="db-form-error">{labels.invalid}</p> : null}
        {state.status === 'consent' ? <p className="db-form-error">{labels.consentNeeded}</p> : null}
        {state.status === 'unavailable' ? <p className="db-form-error">{labels.unavailable}</p> : null}
        {state.status === 'ratelimited' ? <p className="db-form-error">{labels.rateLimited}</p> : null}
      </div>
      <div className="db-field">
        <label htmlFor={id('phone')} className="db-label">{labels.phone}</label>
        <input id={id('phone')} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="01711 000000" className="db-input" aria-describedby={id('phone-hint')} />
        {labels.phoneHint ? <p id={id('phone-hint')} className="db-form-note">{labels.phoneHint}</p> : null}
      </div>
      <fieldset className="db-field db-alert-channels">
        <legend className="db-label">{labels.channel}</legend>
        <label><input type="radio" name="channel" value="sms" defaultChecked /> {labels.sms}</label>
        <label><input type="radio" name="channel" value="whatsapp" /> {labels.whatsapp}</label>
      </fieldset>
      {mode === 'subscribe' ? (
        <label className="db-check"><input type="checkbox" name="consent" /> {labels.consent}</label>
      ) : null}
      <div className="db-actions">
        <button type="submit" className="db-btn db-btn-primary" disabled={pending}>
          {pending ? labels.sending : mode === 'subscribe' ? labels.subscribe : labels.unsubscribe}
        </button>
        <button type="button" className="db-btn db-btn-secondary" onClick={() => setMode((m) => (m === 'subscribe' ? 'unsubscribe' : 'subscribe'))}>
          {mode === 'subscribe' ? labels.switchToUnsubscribe : labels.switchToSubscribe}
        </button>
      </div>
      <div className="db-honeypot" aria-hidden="true">
        <label htmlFor={id('company')}>{labels.honeypot}</label>
        <input id={id('company')} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </form>
  );
}
