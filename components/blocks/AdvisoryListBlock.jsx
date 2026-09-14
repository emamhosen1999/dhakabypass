import { getScheduledAdvisoriesCached } from '../../lib/corridor/cache.js';
import { localeMessage } from '../../lib/corridor/advisories.js';
import { t } from '../../lib/i18n/ui.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const SEVERITY_KEY = { closure: 'sevClosure', warning: 'sevWarning', info: 'sevInfo' };
const INTL = { en: 'en-GB', bn: 'bn-BD', zh: 'zh-CN' };

/** A stored Dhaka wall-clock DATETIME, formatted for the reader, or ''. */
function when(value, locale) {
  if (!value) return '';
  const s = value instanceof Date
    ? value
    : new Date(`${String(value).slice(0, 19).replace(' ', 'T')}`);
  if (Number.isNaN(s.getTime())) return '';
  return new Intl.DateTimeFormat(INTL[locale] || 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(s);
}

export default async function AdvisoryListBlock({ data = {}, locale }) {
  let rows = [];
  try { rows = await getScheduledAdvisoriesCached(); } catch { rows = []; }
  const heading = text(data.heading);
  const intro = text(data.intro);
  return (
    <section className="db-block db-advisorylist">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {rows.length === 0 ? (
        <p className="db-empty-inline">{text(data.emptyMessage) || t(locale, 'advisoriesNone')}</p>
      ) : (
        <ul className="db-advisorylist-items">
          {rows.map((r) => {
            const from = when(r.starts_at, locale);
            const until = when(r.ends_at, locale);
            return (
              <li key={r.id} className={`db-advisory db-advisory-${r.severity}`}>
                <span className="db-advisory-tag">{t(locale, SEVERITY_KEY[r.severity] || 'sevInfo')}</span>
                {r.upcoming ? <span className="db-advisory-tag">{t(locale, 'advisoryUpcoming')}</span> : null}
                <span className="db-advisory-text">{localeMessage(r, locale)}</span>
                {from || until ? (
                  <span className="db-advisory-when">
                    {from ? t(locale, 'advisoryFrom').replace('{date}', from) : ''}
                    {from && until ? ' · ' : ''}
                    {until ? t(locale, 'advisoryUntil').replace('{date}', until) : ''}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
