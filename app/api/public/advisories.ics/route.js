import { getScheduledAdvisoriesCached } from '../../../../lib/corridor/cache.js';
import { getSeoSettingsCached } from '../../../../lib/seo/cache.js';
import { siteOrigin } from '../../../../lib/seo/site.js';
import { isLocale, DEFAULT_LOCALE } from '../../../../lib/i18n/locales.js';
import { advisoriesIcs } from '../../../../lib/open-data/format.js';
import { respondOpenData, preflight } from '../../../../lib/open-data/respond.js';
import { orLog } from '../../../../lib/log.js';

/**
 * Open data: closures and roadworks as a calendar a fleet office can
 * subscribe to. `?lang=bn` picks the language of the event titles; the
 * calendar is named after the site title in that language.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return respondOpenData(request, async () => {
    const wanted = new URL(request.url).searchParams.get('lang') || DEFAULT_LOCALE;
    const locale = isLocale(wanted) ? wanted : DEFAULT_LOCALE;
    const [advisories, seo] = await Promise.all([
      getScheduledAdvisoriesCached().catch(orLog('opendata.scheduled_advisories_failed', [])),
      getSeoSettingsCached(locale).catch(orLog('opendata.seo_settings_failed', null)),
    ]);
    const host = new URL(siteOrigin()).host;
    return {
      body: advisoriesIcs(advisories, { locale, host, name: seo?.siteTitle || host }),
      contentType: 'text/calendar; charset=utf-8',
      extra: { 'content-disposition': 'inline; filename="dhaka-bypass-advisories.ics"' },
    };
  }, { name: 'open-data.ics' });
}

export const OPTIONS = preflight;
