import Link from 'next/link';
import { localeHref } from '../../lib/blocks/href.js';
import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';
import { t } from '../../lib/i18n/ui.js';

const INTL = { en: 'en-GB', bn: 'bn-BD', zh: 'zh-CN' };

/**
 * A scrim, not a filter. The inherited aerial is 686px wide and will be soft
 * on a large display; a strong bottom-weighted gradient makes that softness
 * read as depth and guarantees the headline's contrast regardless of which
 * photograph an operator swaps in later.
 */
export default async function HeroBlock({ data, locale, pageUpdatedAt = null }) {
  const showUpdated = data?.showUpdated === 'yes' && pageUpdatedAt instanceof Date;
  let media = null;
  if (data.image) {
    try { media = await getMediaByPath(data.image); } catch { media = null; }
  }
  return (
    <section className="db-hero">
      {media ? (
        <div className="db-hero-bg" aria-hidden="true">
          <SiteImage media={{ ...media, alt: {} }} locale={locale} priority sizes="100vw" />
        </div>
      ) : null}
      <div className="db-hero-inner">
        {data.eyebrow ? <p className="db-hero-eyebrow">{data.eyebrow}</p> : null}
        <h1 className="db-hero-title">{data.headline}</h1>
        {data.standfirst ? <p className="db-hero-standfirst">{data.standfirst}</p> : null}
        {(data.primaryLabel && data.primaryHref) || (data.secondaryLabel && data.secondaryHref) ? (
          <p className="db-actions">
            {data.primaryLabel && data.primaryHref ? (
              <Link href={localeHref(data.primaryHref, locale)} className="db-btn db-btn-primary">{data.primaryLabel}</Link>
            ) : null}
            {data.secondaryLabel && data.secondaryHref ? (
              <Link href={localeHref(data.secondaryHref, locale)} className="db-btn db-btn-ondark">{data.secondaryLabel}</Link>
            ) : null}
          </p>
        ) : null}
        {showUpdated ? (
          <p className="db-page-updated db-hero-updated">
            {t(locale, 'lastUpdated')}{' '}
            <time dateTime={pageUpdatedAt.toISOString().slice(0, 10)}>
              {new Intl.DateTimeFormat(INTL[locale] || 'en-GB', { dateStyle: 'long' }).format(pageUpdatedAt)}
            </time>
          </p>
        ) : null}
      </div>
    </section>
  );
}
