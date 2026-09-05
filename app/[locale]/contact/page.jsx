import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales.js';
import { t } from '../../../lib/i18n/ui.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import ContactForm from './ContactForm.jsx';
import { getContactDetailsCached } from '../../../lib/settings-cache.js';

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

  // A settings read must never take this page down — getContactDetails already
  // swallows its own failure and returns empty, which renders the same callout
  // as "not supplied yet". Both mean the reader cannot see a phone number, and
  // only one of them is anybody's fault.
  const details = await getContactDetailsCached(locale);

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
          {/* Filled from site_settings, editable at /admin/settings. Until
              DBEDC supplies them the callout below stands in — same
              construction as the institutional pages: a word as well as a
              colour, because status is never colour alone here. */}
          {details.isEmpty ? (
            <p className="db-pending">
              <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
              {t(locale, 'contactDetailsPending')}
            </p>
          ) : (
            <dl className="db-contact-list">
              {details.address ? (
                <div>
                  <dt>{t(locale, 'contactAddress')}</dt>
                  {/* The address is typed as free text with line breaks, so it
                      renders with them preserved rather than collapsed. */}
                  <dd className="db-contact-address">{details.address}</dd>
                </div>
              ) : null}
              {details.phone ? (
                <div>
                  <dt>{t(locale, 'contactPhone')}</dt>
                  {/* tel: with spaces stripped — a dialler cannot handle them,
                      while a reader needs them to read the number. */}
                  <dd><a href={`tel:${details.phone.replace(/[^\d+]/g, '')}`}>{details.phone}</a></dd>
                </div>
              ) : null}
              {details.emergency ? (
                <div>
                  <dt>{t(locale, 'contactEmergency')}</dt>
                  <dd>
                    <a href={`tel:${details.emergency.replace(/[^\d+]/g, '')}`}>{details.emergency}</a>
                  </dd>
                </div>
              ) : null}
              {details.email ? (
                <div>
                  <dt>{t(locale, 'contactEmail')}</dt>
                  <dd><a href={`mailto:${details.email}`}>{details.email}</a></dd>
                </div>
              ) : null}
              {details.hours ? (
                <div>
                  <dt>{t(locale, 'contactHours')}</dt>
                  <dd>{details.hours}</dd>
                </div>
              ) : null}
            </dl>
          )}

          <h2 className="db-h2">{t(locale, 'contactOtherHeading')}</h2>
          <p className="db-prose">{t(locale, 'contactOtherBody')}</p>
        </aside>
      </section>
    </>
  );
}
