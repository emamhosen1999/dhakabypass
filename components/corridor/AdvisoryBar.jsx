// components/corridor/AdvisoryBar.jsx
import { getActiveAdvisoriesCached } from '../../lib/corridor/cache';
import { localeMessage } from '../../lib/corridor/advisories';
import { t } from '../../lib/i18n/ui';

const SEVERITY_KEY = { closure: 'sevClosure', warning: 'sevWarning', info: 'sevInfo' };

export default async function AdvisoryBar({ locale }) {
  let advisories = [];
  try {
    advisories = await getActiveAdvisoriesCached();
  } catch {
    // An advisory lookup must never take the whole page down. No bar is the
    // safe failure: pages still render and /travel/status carries the detail.
    return null;
  }

  const top = advisories[0];
  if (!top) return null;

  const message = localeMessage(top, locale);
  if (!message) return null;

  return (
    // Always role="status" + aria-live="polite", never role="alert" — this bar is
    // standing context present on every page load, not a one-off event. Live
    // regions generally aren't announced for content that already exists when
    // the region mounts, so "alert" has little effect on first load; its real
    // effect shows up on client-side navigation, where an assertive region would
    // re-interrupt the user with a closure notice they already heard on the
    // previous page. Severity is still conveyed — via the visible text tag
    // (SEVERITY_KEY) and colour, never through the ARIA role.
    <div
      className={`db-advisory db-advisory-${top.severity}`}
      role="status"
      aria-live="polite"
    >
      <div className="db-advisory-inner">
        <span className="db-advisory-tag">{t(locale, SEVERITY_KEY[top.severity] || 'sevInfo')}</span>
        <span className="db-advisory-msg">{message}</span>
      </div>
    </div>
  );
}
