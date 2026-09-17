import { getCorridorWeatherCached } from '../../lib/weather/cache.js';
import { assess, combine, weatherWordKey } from '../../lib/weather/advisory.js';
import { localeText } from '../../lib/corridor/interchanges';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';
import ScrollArrows from '../chrome/ScrollArrows.jsx';

const INTL = { bn: 'bn-BD', zh: 'zh-CN' };
const FLAG_TAG = { fog: 'alert', rain: 'build', wind: 'build' };
const FLAG_KEY = { fog: 'wxFogAt', rain: 'wxRainAt', wind: 'wxWindAt' };
const ADVICE_KEY = { fog: 'wxAdviceFog', rain: 'wxAdviceRain', wind: 'wxAdviceWind' };
const ADVICE_FIELD = { fog: 'adviceFog', rain: 'adviceRain', wind: 'adviceWind' };
const FLAG_WORD = { fog: 'wxFog', rain: 'wxRain', wind: 'wxWind' };

/** "2026-09-17T14:15" from Open-Meteo is Dhaka wall clock; pin the offset. */
function dhakaTime(isoLocal, intlLocale) {
  if (typeof isoLocal !== 'string') return null;
  const d = new Date(`${isoLocal.slice(0, 16)}:00+06:00`);
  if (Number.isNaN(d.getTime())) return null;
  return {
    label: new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }).format(d),
    iso: d.toISOString(),
  };
}

/**
 * Weather at three points along the road, and the advisory the thresholds
 * derive from it. Colour never carries the advisory alone: each line names
 * the hazard, the place and the figure, and the table repeats the readings.
 */
export default async function CorridorWeatherBlock({ data = {}, locale }) {
  let weather = null;
  let thresholds = {};
  try {
    const loaded = await getCorridorWeatherCached();
    weather = loaded?.weather || null;
    thresholds = loaded?.thresholds || {};
  } catch { weather = null; }

  const heading = text(data.heading);
  const intro = text(data.intro);
  const head = (
    <>
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
    </>
  );

  if (!weather || !Array.isArray(weather.points) || weather.points.length === 0) {
    return (
      <section className="db-block db-weather">
        {head}
        <p className="db-empty-inline">{text(data.unavailableMessage) || t(locale, 'wxUnavailable')}</p>
      </section>
    );
  }

  const intlLocale = INTL[locale] || 'en-GB';
  const nf = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 });
  const placeName = (p) => localeText(p.names, locale) || `${t(locale, 'mapWaypoint')}`;

  const assessed = weather.points.map((p) => ({ point: p, result: assess(p.reading, thresholds) }));
  const overall = combine(assessed.map((a) => a.result));

  const notices = overall.flags.map((flag) => {
    const where = assessed.filter((a) => a.result.flags.includes(flag));
    const figure = (a) => {
      const r = a.point.reading;
      if (flag === 'fog') return r.visibilityM === null ? '—' : nf0.format(r.visibilityM);
      if (flag === 'rain') return nf.format(r.rainMm ?? 0);
      return nf0.format(Math.max(r.windKmh || 0, r.gustKmh || 0));
    };
    const worst = where.reduce((acc, a) => {
      if (!acc) return a;
      const r = a.point.reading; const b = acc.point.reading;
      if (flag === 'fog') return (r.visibilityM ?? Infinity) < (b.visibilityM ?? Infinity) ? a : acc;
      if (flag === 'rain') return (r.rainMm ?? 0) > (b.rainMm ?? 0) ? a : acc;
      return Math.max(r.windKmh || 0, r.gustKmh || 0) > Math.max(b.windKmh || 0, b.gustKmh || 0) ? a : acc;
    }, null);
    const message = t(locale, FLAG_KEY[flag])
      .replace('{place}', where.map((a) => placeName(a.point)).join(', '))
      .replace('{n}', worst ? figure(worst) : '—');
    const advice = text(data[ADVICE_FIELD[flag]]) || t(locale, ADVICE_KEY[flag]);
    return { flag, message, advice };
  });

  const stamp = dhakaTime(weather.points[0]?.reading?.time || weather.fetchedAt, intlLocale);
  const dash = '—';

  return (
    <section className="db-block db-weather">
      {head}

      {notices.length ? (
        <ul className="db-statusnotices db-weather-notices" role="status" aria-live="polite">
          {notices.map((n) => (
            <li key={n.flag} className="db-statusnotice">
              <span className={`db-tag db-tag-${FLAG_TAG[n.flag]}`}>{t(locale, 'sevWarning')}</span>
              <span className="db-statusnotice-msg">
                {n.message}
                {n.advice ? <span className="db-weather-advice">{n.advice}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="db-weather-clear">
          <span className="db-tag db-tag-open">{t(locale, 'wxClearTag')}</span>
          <span>{t(locale, 'wxNoAdvisory')}</span>
        </p>
      )}

      <ScrollArrows locale={locale} />
      <div className="db-scroll-x db-weather-table" tabIndex={0} aria-label={t(locale, 'wxCaption')}>
        <table className="db-table">
          <caption className="db-table-caption">{t(locale, 'wxCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t(locale, 'colLocation')}</th>
              <th scope="col">{t(locale, 'wxConditions')}</th>
              <th scope="col" className="db-num">{`${t(locale, 'wxVisibility')} (${t(locale, 'mapM')})`}</th>
              <th scope="col" className="db-num">{`${t(locale, 'wxRain')} (${t(locale, 'wxMm')})`}</th>
              <th scope="col" className="db-num">{`${t(locale, 'wxWind')} (${t(locale, 'mapKmh')})`}</th>
              <th scope="col" className="db-num">{`${t(locale, 'wxTemperature')} (°C)`}</th>
            </tr>
          </thead>
          <tbody>
            {assessed.map(({ point, result }) => {
              const r = point.reading;
              return (
                <tr key={`${point.lat},${point.lng}`}>
                  <th scope="row">
                    {placeName(point)}
                    {result.flags.length ? (
                      <span className="db-visually-hidden">{` — ${result.flags.map((f) => t(locale, FLAG_WORD[f])).join(', ')}`}</span>
                    ) : null}
                  </th>
                  <td>
                    <span className={`db-sectiontag${result.flags.length ? ' db-weather-flagged' : ''}`}>{t(locale, weatherWordKey(r.code))}</span>
                  </td>
                  <td className="db-num">{r.visibilityM === null ? dash : nf0.format(r.visibilityM)}</td>
                  <td className="db-num">{r.rainMm === null ? dash : nf.format(r.rainMm)}</td>
                  <td className="db-num">{r.windKmh === null ? dash : nf0.format(r.windKmh)}</td>
                  <td className="db-num">{r.temperatureC === null ? dash : nf.format(r.temperatureC)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="db-sectionmeta db-weather-source">
        {t(locale, 'wxSource').replace('{source}', weather.attribution || 'Open-Meteo')}
        {stamp ? <> · <time dateTime={stamp.iso}>{stamp.label}</time></> : null}
        {' · '}
        {t(locale, 'wxModelNote')}
      </p>
    </section>
  );
}
