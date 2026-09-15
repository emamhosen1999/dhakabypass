import { t } from '../../lib/i18n/ui.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const INTL = { en: 'en-GB', bn: 'bn-BD', zh: 'zh-CN' };

/** The same markup the travel pages carried in code: db-page-head, db-h1, db-lede. */
export default function PageHeaderBlock({ data, locale = 'en', pageUpdatedAt = null }) {
  const heading = text(data?.heading);
  if (!heading) return null;
  const eyebrow = text(data?.eyebrow);
  const lede = text(data?.lede);
  const showUpdated = data?.showUpdated === 'yes' && pageUpdatedAt instanceof Date;
  return (
    <header className="db-page-head">
      {eyebrow ? <p className="db-eyebrow">{eyebrow}</p> : null}
      <h1 className="db-h1">{heading}</h1>
      {lede ? <p className="db-lede">{lede}</p> : null}
      {showUpdated ? (
        <p className="db-page-updated">
          {t(locale, 'lastUpdated')}{' '}
          <time dateTime={pageUpdatedAt.toISOString().slice(0, 10)}>
            {new Intl.DateTimeFormat(INTL[locale] || 'en-GB', { dateStyle: 'long' }).format(pageUpdatedAt)}
          </time>
        </p>
      ) : null}
    </header>
  );
}
