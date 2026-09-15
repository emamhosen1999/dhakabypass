import { t } from '../../lib/i18n/ui.js';
import AlertSignup from '../alerts/AlertSignup.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** SMS / WhatsApp road alerts sign-up (W4.13). Labels from ui_strings. */
export default function AlertSignupBlock({ data = {}, locale, blockId }) {
  const heading = text(data.heading) || t(locale, 'alertHeading');
  const intro = text(data.intro);
  const labels = {
    phone: t(locale, 'alertPhone'), phoneHint: t(locale, 'formPhoneHint'), channel: t(locale, 'alertChannel'), sms: 'SMS', whatsapp: 'WhatsApp',
    consent: t(locale, 'alertConsent'), consentNeeded: t(locale, 'alertConsentNeeded'),
    subscribe: t(locale, 'alertSubscribe'), unsubscribe: t(locale, 'alertUnsubscribe'),
    switchToUnsubscribe: t(locale, 'alertSwitchUnsubscribe'), switchToSubscribe: t(locale, 'alertSwitchSubscribe'),
    ok: t(locale, 'alertOk'), unsubscribed: t(locale, 'alertUnsubscribed'), invalid: t(locale, 'alertInvalid'),
    sending: t(locale, 'formSending'), unavailable: t(locale, 'formErrorUnavailable'), rateLimited: t(locale, 'formErrorRateLimited'),
    honeypot: t(locale, 'formHoneypot'),
  };
  return (
    <section className="db-block db-alert-block">
      <h2 className="db-h2">{heading}</h2>
      {intro ? <p className="db-prose">{intro}</p> : null}
      <AlertSignup labels={labels} locale={locale} blockId={blockId ?? 'x'} />
    </section>
  );
}
