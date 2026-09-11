import { t } from '../../lib/i18n/ui.js';
import { fieldPlan, isKind } from '../../lib/requests/policy.js';
import { submitServiceRequest } from '../../lib/requests/actions.js';
import RequestForm from '../requests/RequestForm.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * A tracked service request: grievance, toll dispute, breakdown assistance,
 * lost & found, or a general request — one block type, configured by the
 * operator.
 *
 * The block's configuration is BOUND into the Server Action here, on the
 * server, and the bound action is what the client form calls. That is what
 * keeps the request's kind and deadline the operator's decision rather than
 * the visitor's: Next encrypts bound arguments, and the form carries no
 * hidden field a browser could edit.
 *
 * Labels come from ui_strings; the heading, intro and the note shown with
 * the tracking number are the block's own.
 */
export default function RequestFormBlock({ data, locale }) {
  const kind = isKind(data?.kind) ? data.kind : 'general';
  const config = {
    kind, locale,
    askPhone: data?.askPhone, askEmail: data?.askEmail,
    askVehicle: data?.askVehicle, askLocation: data?.askLocation,
    slaDays: data?.slaDays,
  };
  const plan = fieldPlan(config);
  const action = submitServiceRequest.bind(null, config);

  const labels = {
    name: t(locale, 'formName'), email: t(locale, 'formEmail'), phone: t(locale, 'formPhone'),
    vehicle: t(locale, 'formVehicle'), location: t(locale, 'formLocation'),
    contactEither: t(locale, 'formContactEither'),
    subject: t(locale, 'formSubject'), message: t(locale, 'formMessage'),
    send: t(locale, 'formSend'), sending: t(locale, 'formSending'),
    sentHeading: t(locale, 'requestSentHeading'), sentBody: t(locale, 'requestSentBody'),
    trackingLabel: t(locale, 'requestTrackingLabel'), keepNumber: t(locale, 'requestKeepNumber'),
    errorRequired: t(locale, 'requestErrorRequired'), errorUnavailable: t(locale, 'formErrorUnavailable'),
    errorRateLimited: t(locale, 'formErrorRateLimited'), errorTooLong: t(locale, 'formErrorTooLong'),
    privacy: t(locale, 'formPrivacy'), honeypot: t(locale, 'formHoneypot'),
  };

  const heading = text(data?.heading) || t(locale, `requestKind_${kind}`);
  const intro = text(data?.intro);

  return (
    <section className="db-block db-request-block">
      <h2 className="db-h2">{heading}</h2>
      {intro ? <p className="db-prose">{intro}</p> : null}
      <RequestForm action={action} plan={plan} labels={labels} successNote={text(data?.successNote)} />
    </section>
  );
}
