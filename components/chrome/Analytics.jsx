import { analyticsConfig } from '../../lib/analytics/config.js';
import ConsentBanner from './ConsentBanner.jsx';

/**
 * The analytics tag, or nothing at all.
 *
 * A server component: the configuration is read from the server environment, so
 * no measurement ID is inlined into the client bundle by a NEXT_PUBLIC_ name and
 * the whole thing disappears from the HTML when analytics is off — rather than
 * shipping a disabled script that a reader can still see in view-source.
 *
 * Rendered only inside app/[locale]/layout.jsx. The admin is deliberately not
 * measured (it is staff, behind auth, and their page views are not analytics),
 * and the legacy tree is not touched at all.
 */
export default function Analytics({ locale }) {
  const config = analyticsConfig(process.env);
  if (!config.enabled) return null;

  if (config.provider === 'plausible') {
    return (
      <script
        defer
        data-domain={config.siteId}
        src={config.scriptUrl}
      />
    );
  }

  if (config.provider === 'umami') {
    return (
      <script
        defer
        data-website-id={config.siteId}
        src={config.scriptUrl}
      />
    );
  }

  // ga4. Consent Mode v2 with everything DENIED is set BEFORE the tag loads —
  // the order matters, because a default set after gtag.js has initialised is
  // applied too late and the first page view is already sent. The banner is what
  // moves it to granted, and until someone chooses, nothing is measured.
  const consentDefaults = [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('consent','default',{",
    "'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied',",
    "'analytics_storage':'denied','wait_for_update':500});",
    // A stored choice from a previous visit is applied immediately, so an
    // accepting visitor is not asked again and is measured from the first page.
    "try{if(localStorage.getItem('db-analytics-consent')==='granted')",
    "gtag('consent','update',{'analytics_storage':'granted'});}catch(e){}",
    "gtag('js',new Date());",
    `gtag('config','${config.siteId}',{'anonymize_ip':true});`,
  ].join('');

  return (
    <>
      {/* Inline, not a file: this has to execute before gtag.js arrives. */}
      <script dangerouslySetInnerHTML={{ __html: consentDefaults }} />
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.siteId)}`} />
      <ConsentBanner locale={locale} />
    </>
  );
}
