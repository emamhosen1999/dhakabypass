import { t } from '../../lib/i18n/ui.js';
import NewsletterSignup from '../newsletter/NewsletterSignup.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** Email sign-up for operational notices. Labels from ui_strings; heading,
 *  invitation, button and note from the block. */
export default function NewsletterFormBlock({ data, locale }) {
  const heading = text(data?.heading) || t(locale, 'newsletterHeading');
  const intro = text(data?.intro);
  const labels = {
    email: t(locale, 'formEmail'),
    button: text(data?.buttonLabel) || t(locale, 'newsletterSubscribe'),
    sending: t(locale, 'formSending'),
    ok: t(locale, 'newsletterOk'),
    invalid: t(locale, 'newsletterInvalid'),
    unavailable: t(locale, 'formErrorUnavailable'),
    rateLimited: t(locale, 'formErrorRateLimited'),
    honeypot: t(locale, 'formHoneypot'),
    note: text(data?.note) || t(locale, 'newsletterNote'),
  };

  return (
    <section className="db-block db-newsletter-block">
      <h2 className="db-h2">{heading}</h2>
      {intro ? <p className="db-prose">{intro}</p> : null}
      <NewsletterSignup labels={labels} />
    </section>
  );
}
