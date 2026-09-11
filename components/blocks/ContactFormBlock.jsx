import { t } from '../../lib/i18n/ui.js';
import { getContactDetailsCached } from '../../lib/settings-cache.js';
import ContactForm from '../contact/ContactForm.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const tel = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

/**
 * What /contact rendered, as a block. The form, its Server Action, honeypot,
 * rate limit and live-region messaging are the existing ContactForm,
 * unchanged. Labels come from ui_strings; office details from site_settings.
 *
 * The page used to fall back to a hardcoded Baridhara address and
 * info@dbedc.com when the settings were empty - English-only literals a
 * Bangla reader saw too, inherited from the old site and confirmed by nobody.
 * This block does not. Empty settings render a "not yet published" callout;
 * if DBEDC wants an address shown, it is typed once at /admin/settings and is
 * then theirs.
 */
export default async function ContactFormBlock({ data, locale }) {
  let details = { isEmpty: true };
  try {
    details = await getContactDetailsCached(locale);
  } catch { /* the callout below stands in */ }

  const labels = {
    name: t(locale, 'formName'), email: t(locale, 'formEmail'),
    subject: t(locale, 'formSubject'), message: t(locale, 'formMessage'),
    send: t(locale, 'formSend'), sending: t(locale, 'formSending'),
    sentHeading: t(locale, 'formSentHeading'), sentBody: t(locale, 'formSentBody'),
    errorRequired: t(locale, 'formErrorRequired'), errorUnavailable: t(locale, 'formErrorUnavailable'),
    errorRateLimited: t(locale, 'formErrorRateLimited'), errorTooLong: t(locale, 'formErrorTooLong'),
    privacy: t(locale, 'formPrivacy'), honeypot: t(locale, 'formHoneypot'),
  };

  const heading = text(data?.heading) || t(locale, 'contactWriteHeading');
  const intro = text(data?.intro) || t(locale, 'contactWriteBody');
  const showDetails = data?.showDetails !== 'no';

  return (
    <section className={`db-block${showDetails ? ' db-contact-grid' : ''}`}>
      <div>
        <h2 className="db-h2">{heading}</h2>
        <p className="db-prose">{intro}</p>
        <ContactForm labels={labels} />
      </div>

      {showDetails ? (
        <aside className="db-contact-aside">
          <h2 className="db-h2">{t(locale, 'contactDetailsHeading')}</h2>
          {details.isEmpty ? (
            <p className="db-pending">
              <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
              {t(locale, 'contactDetailsPending')}
            </p>
          ) : (
            <dl className="db-contact-list">
              {details.address ? (
                <div><dt>{t(locale, 'contactAddress')}</dt><dd className="db-contact-address">{details.address}</dd></div>
              ) : null}
              {details.phone ? (
                <div><dt>{t(locale, 'contactPhone')}</dt><dd><a href={tel(details.phone)}>{details.phone}</a></dd></div>
              ) : null}
              {details.emergency ? (
                <div><dt>{t(locale, 'contactEmergency')}</dt><dd><a href={tel(details.emergency)}>{details.emergency}</a></dd></div>
              ) : null}
              {details.email ? (
                <div><dt>{t(locale, 'contactEmail')}</dt><dd><a href={`mailto:${details.email}`}>{details.email}</a></dd></div>
              ) : null}
              {details.hours ? (
                <div><dt>{t(locale, 'contactHours')}</dt><dd>{details.hours}</dd></div>
              ) : null}
            </dl>
          )}
        </aside>
      ) : null}
    </section>
  );
}
