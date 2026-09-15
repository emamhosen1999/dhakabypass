import { t } from '../../lib/i18n/ui.js';
import { lookupRequest, normaliseTracking } from '../../lib/requests/status.js';
import { text } from '../../lib/blocks/items.js';

const INTL = { en: 'en-GB', bn: 'bn-BD', zh: 'zh-CN' };
const KIND_KEY = {
  grievance: 'requestKind_grievance', toll_dispute: 'requestKind_toll_dispute', breakdown: 'requestKind_breakdown',
  lost_found: 'requestKind_lost_found', general: 'requestKind_general', fleet_account: 'requestKind_fleet_account',
  etc_tag: 'requestKind_etc_tag', loyalty: 'requestKind_loyalty',
};

const when = (value, locale) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(INTL[locale] || 'en-GB', { dateStyle: 'long' }).format(d);
};

/**
 * Status by tracking number, server-rendered from `?track=&proof=` so it
 * needs no script. The answer names the kind, status and dates only; the
 * proof (last four digits of the phone, or the email) keeps a number that
 * was read out in a toll booth from opening someone else's case.
 */
export default async function RequestStatusBlock({ data, locale, blockId, searchParams }) {
  const sp = (await searchParams) || {};
  const track = normaliseTracking(sp.track);
  const proof = String(sp.proof || '').slice(0, 120);
  const asked = Boolean(sp.track || sp.proof);
  let result = null;
  if (asked) {
    try { result = await lookupRequest(track, proof); } catch { result = { outcome: 'unavailable' }; }
  }
  const id = (n) => `rs-${blockId}-${n}`;
  const heading = text(data?.heading) || t(locale, 'statusHeading');
  const intro = text(data?.intro) || t(locale, 'statusIntro');
  const statusLabel = (s) => t(locale, `status_${s}`) || s;

  return (
    <section className="db-block db-request-status" id={`request-status-${blockId}`}>
      <h2 className="db-h2">{heading}</h2>
      {intro ? <p className="db-lede">{intro}</p> : null}
      <form method="get" action={`#request-status-${blockId}`} className="db-form db-status-form">
        <div className="db-field">
          <label htmlFor={id('track')} className="db-label">{t(locale, 'statusTracking')}</label>
          <input id={id('track')} name="track" defaultValue={sp.track || ''} required autoComplete="off" spellCheck={false}
            className="db-input" aria-describedby={id('track-hint')} />
          <p id={id('track-hint')} className="db-form-note">{t(locale, 'statusTrackingHint')}</p>
        </div>
        <div className="db-field">
          <label htmlFor={id('proof')} className="db-label">{t(locale, 'statusProof')}</label>
          <input id={id('proof')} name="proof" defaultValue={sp.proof || ''} required autoComplete="off" className="db-input" aria-describedby={id('proof-hint')} />
          <p id={id('proof-hint')} className="db-form-note">{t(locale, 'statusProofHint')}</p>
        </div>
        <div className="db-actions">
          <button type="submit" className="db-btn db-btn-primary">{t(locale, 'statusCheck')}</button>
        </div>
      </form>

      {asked ? (
        <div className="db-status-result" role="status" aria-live="polite">
          {result?.outcome === 'found' ? (
            <dl className="db-status-card">
              <div><dt>{t(locale, 'requestTrackingLabel')}</dt><dd><code>{result.trackingNo}</code></dd></div>
              <div><dt>{t(locale, 'statusKind')}</dt><dd>{t(locale, KIND_KEY[result.kind] || 'requestKind_general')}</dd></div>
              <div><dt>{t(locale, 'colStatus')}</dt><dd><span className={`db-status-tag db-status-${result.status}`}>{statusLabel(result.status)}</span>{result.overdue ? ` · ${t(locale, 'statusOverdue')}` : ''}</dd></div>
              <div><dt>{t(locale, 'statusFiled')}</dt><dd>{when(result.createdAt, locale)}</dd></div>
              {result.resolvedAt
                ? <div><dt>{t(locale, 'statusResolved')}</dt><dd>{when(result.resolvedAt, locale)}</dd></div>
                : result.dueAt ? <div><dt>{t(locale, 'statusDue')}</dt><dd>{when(result.dueAt, locale)}</dd></div> : null}
            </dl>
          ) : result?.outcome === 'unavailable' ? (
            <p className="db-form-error">{t(locale, 'formErrorUnavailable')}</p>
          ) : (
            <p className="db-form-error">{t(locale, 'statusNotFound')}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
