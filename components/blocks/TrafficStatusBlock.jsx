import { getSectionStatusCached } from '../../lib/corridor/traffic-cache';
import { getActiveAdvisoriesCached } from '../../lib/corridor/cache';
import { localeMessage } from '../../lib/corridor/advisories';
import { conditionColour, conditionLabelKey } from '../../lib/corridor/conditions.js';
import { selectSections, conditionsPresent, waypointNames } from '../../lib/blocks/trafficStatus.js';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';

const SEVERITY_KEY = { closure: 'sevClosure', warning: 'sevWarning', info: 'sevInfo' };
const SEVERITY_TAG = { closure: 'alert', warning: 'build', info: 'planned' };
const severityKey = (s) => (Object.hasOwn(SEVERITY_KEY, s ?? '') ? SEVERITY_KEY[s] : 'sevInfo');
const severityTag = (s) => (Object.hasOwn(SEVERITY_TAG, s ?? '') ? SEVERITY_TAG[s] : 'planned');

const INTL = { bn: 'bn-BD', zh: 'zh-CN' };

/**
 * A measurement is printed in Dhaka's own time, named as a time zone rather
 * than as a number of minutes (audit 2.13), so the label and the machine
 * value both follow the zone database instead of a constant. Formatting in
 * the SERVER's zone would print a Dhaka measurement in whatever zone the
 * shared host happens to be set to.
 */
const CORRIDOR_TIME_ZONE = 'Asia/Dhaka';

function measuredParts(date, intlLocale) {
  const label = new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium', timeStyle: 'short', timeZone: CORRIDOR_TIME_ZONE,
  }).format(date);
  // The machine-readable half carries the zone's offset explicitly, so the
  // value is an instant rather than an ambiguous wall clock.
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: CORRIDOR_TIME_ZONE, hourCycle: 'h23', timeZoneName: 'longOffset',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date).map((x) => [x.type, x.value]));
  const offset = (parts.timeZoneName || '').replace(/^GMT/, '') || 'Z';
  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
  return { label, iso };
}

/**
 * How the corridor is running right now: one row per `corridor_sections`
 * record, with the active `advisories` above them.
 *
 * A LIVE-DATA BLOCK. It stores no condition, no speed and no advisory text of
 * its own — an operator changes the condition in /admin/corridor/sections and
 * every page carrying this block changes with it. What the block stores is
 * presentation: which sections, in what order, and whether a legend earns the
 * space on this particular page.
 *
 * STATUS IS NEVER COLOUR ALONE. Each row carries the condition as a word from
 * `ui_strings` as well as a swatch in the ramp colour, and the ramp comes from
 * lib/corridor/conditions.js — the same table the corridor map draws from, so
 * a section cannot be amber on the map and orange in the table beside it.
 *
 * AND IT SAYS WHERE THE NUMBERS CAME FROM. While `corridor.traffic_source` is
 * still 'sample' — its default, and its value on this deployment today — the
 * block prints the notice that says so. Sample conditions are still conditions
 * to a reader deciding whether to drive.
 */
export default async function TrafficStatusBlock({ data, locale }) {
  // Settled independently: an advisory outage must not cost the status table,
  // and a section-table outage must not swallow a live closure notice.
  let status = { sections: [], waypoints: [], source: 'sample' };
  let advisories = [];
  const [statusResult, advisoryResult] = await Promise.allSettled([
    getSectionStatusCached(), getActiveAdvisoriesCached(),
  ]);
  if (statusResult.status === 'fulfilled' && statusResult.value) status = statusResult.value;
  if (advisoryResult.status === 'fulfilled' && Array.isArray(advisoryResult.value)) {
    advisories = advisoryResult.value;
  }

  const rows = selectSections(status.sections, data);
  const names = waypointNames(status.waypoints);
  const intlLocale = INTL[locale] || 'en-GB';
  const nf = new Intl.NumberFormat(intlLocale);

  // A waypoint with no published name falls back to "Waypoint 4" — the exact
  // wording the corridor map already uses for the same six unnamed points, so
  // the two never call the same place different things.
  const nameOf = (code) => {
    const map = names[code];
    const value = map && (map[locale] || map.en);
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : `${t(locale, 'mapWaypoint')} ${code}`;
  };

  const heading = text(data.heading);
  const intro = text(data.intro);
  const caption = text(data.caption) || t(locale, 'mapSectionStatus');
  const legend = data.showLegend === 'no' ? [] : conditionsPresent(rows);

  const notices = advisories
    .map((a) => ({ id: a.id, severity: a.severity, message: localeMessage(a, locale) }))
    .filter((a) => a.message);

  return (
    <section className="db-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      {/* The label that keeps the table honest. Falls back to the editable
          `mapSampleTag`/`mapSampleBody` strings the corridor map already
          carries, so an operator who has written no wording of their own
          still gets a notice rather than silence. */}
      {status.source === 'sample' ? (
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'mapSampleTag')}</span>
          {text(data.sourceNotice) || t(locale, 'mapSampleBody')}
        </p>
      ) : null}

      {/* role="status" + aria-live="polite", never "alert": this is standing
          context present on page load, and an assertive region would
          re-interrupt a reader with the same closure on every navigation.
          Severity is carried by the visible word, not by the role. */}
      {notices.length > 0 ? (
        <ul className="db-statusnotices" role="status" aria-live="polite">
          {notices.map((a) => (
            <li key={a.id} className="db-statusnotice">
              <span className={`db-tag db-tag-${severityTag(a.severity)}`}>
                {t(locale, severityKey(a.severity))}
              </span>
              <span className="db-statusnotice-msg">{a.message}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {rows.length === 0 ? (
        /* No sections, a filter that matches none, and a database that will
           not answer all land here — in the operator's own words, falling
           back to the editable `mapNoSections` string. Never a blank hole. */
        <p className="db-empty-inline">{text(data.emptyMessage) || t(locale, 'mapNoSections')}</p>
      ) : (
        <>
          <div className="db-scroll-x db-statustable">
            <table className="db-table">
              <caption className="db-table-caption">{caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(locale, 'colSection')}</th>
                  <th scope="col">{t(locale, 'colStatus')}</th>
                  <th scope="col" className="db-num">{t(locale, 'mapKmh')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const measured = r.measuredAt ? measuredParts(r.measuredAt, intlLocale) : null;
                  return (
                    <tr key={r.id}>
                      <th scope="row">{`${nameOf(r.fromCode)} — ${nameOf(r.toCode)}`}</th>
                      <td>
                        <span
                          className="db-sectiontag"
                          style={{ border: `1px solid ${conditionColour(r.condition)}` }}
                        >
                          {t(locale, conditionLabelKey(r.condition))}
                        </span>
                        {/* When the condition was taken belongs WITH the
                            condition: a speed with no timestamp beside it
                            reads as "now" however old it is. */}
                        {measured ? (
                          <time className="db-sectionmeta" dateTime={measured.iso}>{measured.label}</time>
                        ) : null}
                      </td>
                      <td className="db-num">{r.speed === null ? '—' : nf.format(r.speed)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {legend.length > 0 ? (
            <ul className="db-map-legend db-statuslegend">
              {legend.map((c) => (
                <li key={c}>
                  <i className="db-map-swatch" style={{ background: conditionColour(c) }} aria-hidden="true" />
                  {t(locale, conditionLabelKey(c))}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
