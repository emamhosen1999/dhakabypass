import { OPEN_DATA_ENDPOINTS } from '../../lib/open-data/format.js';
import { OPEN_DATA_MAX_AGE } from '../../lib/open-data/respond.js';
import { siteOrigin } from '../../lib/seo/site.js';
import { localiseProseLinks } from '../../lib/html/prose-links.js';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';

const INTL = { bn: 'bn-BD', zh: 'zh-CN' };

/**
 * The feeds, with their full addresses so a dispatcher can copy one into a
 * dashboard or a calendar. Every name and description is an editable
 * string; the addresses are the routes under app/api/public.
 */
export default function OpenDataBlock({ data = {}, locale }) {
  const origin = siteOrigin();
  const heading = text(data.heading);
  const intro = text(data.intro);
  const note = text(data.note);
  const terms = typeof data.terms === 'string' ? data.terms.trim() : '';
  const nf = new Intl.NumberFormat(INTL[locale] || 'en-GB');

  return (
    <section className="db-block db-opendata">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      <ul className="db-opendata-list">
        {OPEN_DATA_ENDPOINTS.map((e) => {
          const path = e.id === 'advisories' ? `${e.path}?lang=${locale}` : e.path;
          const url = `${origin}${path}`;
          return (
            <li key={e.id} className="db-opendata-item">
              <h3 className="db-opendata-name">
                {t(locale, e.nameKey)}
                <span className="db-tag db-tag-accent" lang="en">{e.format}</span>
              </h3>
              <p className="db-opendata-desc">{t(locale, e.descKey)}</p>
              <a className="db-opendata-url" href={path} lang="en">{url}</a>
            </li>
          );
        })}
      </ul>

      <p className="db-form-note db-opendata-note">
        {t(locale, 'odCacheNote').replace('{n}', nf.format(OPEN_DATA_MAX_AGE))}
        {note ? ` ${note}` : ''}
      </p>

      <h3 className="db-opendata-terms-heading">{t(locale, 'odTermsHeading')}</h3>
      {terms ? (
        <div className="db-prose" dangerouslySetInnerHTML={{ __html: localiseProseLinks(terms, locale) }} />
      ) : (
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
          {t(locale, 'odTermsPending')}
        </p>
      )}
    </section>
  );
}
