import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales.js';
import { t } from '../../../lib/i18n/ui.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import ContactForm from './ContactForm.jsx';

/**
 * Contact.
 *
 * A code route rather than a CMS page because it has behaviour — a form that
 * writes to `contact_messages` — and because it must render even when the
 * database is unreachable. A reader who cannot reach the site's own database is
 * exactly the reader who most needs the postal address.
 *
 * The address, telephone number and email have NOT been supplied by DBEDC.
 * `docs/source-data/2026-09-03-client-decisions.md` lists them as outstanding,
 * and the legacy site's versions are in the unverified pile. They are therefore
 * shown as an explicit gap rather than guessed at: on a contact page a wrong
 * phone number is worse than an absent one, because it sends someone away
 * believing they have tried.
 */
export function generateMetadata({ params }) {
  return Promise.resolve(params).then(({ locale }) => {
    if (!isLocale(locale)) return {};
    return {
      title: t(locale, 'navContact'),
      description: t(locale, 'contactIntro'),
      alternates: alternatesFor('/contact', locale),
    };
  });
}

export default async function ContactPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const labels = {
    name: t(locale, 'formName'),
    email: t(locale, 'formEmail'),
    subject: t(locale, 'formSubject'),
    message: t(locale, 'formMessage'),
    send: t(locale, 'formSend'),
    sending: t(locale, 'formSending'),
    sentHeading: t(locale, 'formSentHeading'),
    sentBody: t(locale, 'formSentBody'),
    errorRequired: t(locale, 'formErrorRequired'),
    errorUnavailable: t(locale, 'formErrorUnavailable'),
    privacy: t(locale, 'formPrivacy'),
    honeypot: t(locale, 'formHoneypot'),
  };

  return (
    <>
      <section className="db-block">
        <p className="db-eyebrow">{t(locale, 'navContact')}</p>
        <h1 className="db-h1">{t(locale, 'contactHeading')}</h1>
        <p className="db-lede">{t(locale, 'contactIntro')}</p>
      </section>

      <section className="db-block db-contact-grid">
        <div>
          <h2 className="db-h2">{t(locale, 'contactWriteHeading')}</h2>
          <p className="db-prose">{t(locale, 'contactWriteBody')}</p>
          <ContactForm labels={labels} />
        </div>

        <aside className="db-contact-aside">
          <h2 className="db-h2">{t(locale, 'contactDetailsHeading')}</h2>
          {/* Same construction as the awaiting-confirmation callouts on the
              institutional pages: a word as well as a colour, because status is
              never colour alone here. */}
          <p className="db-pending">
            <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
            {t(locale, 'contactDetailsPending')}
          </p>

          <h2 className="db-h2">{t(locale, 'contactOtherHeading')}</h2>
          <p className="db-prose">{t(locale, 'contactOtherBody')}</p>
        </aside>
      </section>
    </>
  );
}
