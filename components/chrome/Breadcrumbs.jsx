import Link from 'next/link';
import { t } from '../../lib/i18n/ui.js';

/**
 * The visible breadcrumb (W8N.4, NAV-WAY-01).
 *
 * The site already published BreadcrumbList structured data on every page —
 * search engines were told the trail and the reader was not. It is drawn from
 * the same `crumbs` the JSON-LD is built from, so the two cannot disagree.
 *
 * The last crumb is the page itself: not a link, and marked aria-current so a
 * screen reader announces where the trail ends. Nothing renders on the home
 * page or wherever the trail is a single step.
 */
export default function Breadcrumbs({ crumbs, locale }) {
  if (!Array.isArray(crumbs) || crumbs.length < 2) return null;
  return (
    <nav className="db-breadcrumbs" aria-label={t(locale, 'breadcrumbLabel')}>
      <ol className="db-breadcrumb-list">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.path} className="db-breadcrumb-item">
              {last
                ? <span className="db-breadcrumb-here" aria-current="page">{crumb.name}</span>
                : <Link href={crumb.path} className="db-breadcrumb-link">{crumb.name}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
