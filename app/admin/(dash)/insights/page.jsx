import Link from 'next/link';
import { assertCan } from '../../../../lib/auth/assert-can';
import { readSnapshotsCached } from '../../../../lib/insights/cache';
import { ga4Configured } from '../../../../lib/insights/ga4';
import { siteUrl } from '../../../../lib/insights/search-console';
import { serviceAccount } from '../../../../lib/insights/google-auth';
import { AdminPage } from '../../../../components/admin/ui';

/**
 * How the site is doing, without leaving the admin.
 *
 * Every figure here is a snapshot written by the nightly cron
 * (/api/cron/insights). Nothing on this page calls Google: a GA4 property is
 * blocked entirely after ten server errors in an hour, and a render path that
 * calls an API is a render path that can cause that.
 *
 * TWO HONESTY RULES, because this screen is read as if it were attendance:
 *
 *   A number is always shown with its age. A panel whose last refresh failed
 *   keeps the figures it had and says so in amber; it never empties itself,
 *   because a panel showing zero tells the operator nobody visited the site.
 *
 *   The standing caveat at the top is not decoration. Consent Mode denies
 *   every storage type until a visitor agrees, so GA4 counts the people who
 *   accepted and nobody else. These are floors.
 */
export const dynamic = 'force-dynamic';

const INTL = 'en-GB';
const num = (n) => new Intl.NumberFormat(INTL).format(Number(n) || 0);

function Age({ row }) {
  if (!row.takenAt) return <span className="text-gray-500">never collected</span>;
  const when = new Intl.DateTimeFormat(INTL, { dateStyle: 'medium', timeStyle: 'short' }).format(row.takenAt);
  if (!row.failedAt) return <span className="text-gray-600">collected {when}</span>;
  return (
    <span className="text-amber-800">
      showing {when} — the latest attempt failed{row.note ? `: ${row.note}` : ''}
    </span>
  );
}

function Panel({ row, title, note, children }) {
  return (
    <section className="rounded border border-gray-300 bg-white p-4 space-y-3">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-blue-900">{title}</h2>
        <p className="text-xs"><Age row={row} /></p>
        {note ? <p className="text-xs text-gray-600">{note}</p> : null}
      </header>
      {row.payload ? children(row.payload) : (
        <p className="text-sm text-gray-600">
          Nothing collected yet. The nightly job writes this; until it has run once there is nothing to show.
        </p>
      )}
    </section>
  );
}

const Table = ({ head, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b border-gray-300">
          {head.map((h) => <th key={h} className="py-1 pr-3 font-semibold">{h}</th>)}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

export default async function InsightsPage() {
  // Admin only. Search Console rows carry the free text people typed into
  // Google, which is exactly what lib/analytics/events.js refuses to send to a
  // processor; it does not belong in front of every editor either.
  await assertCan('manage_users');

  const snapshots = await readSnapshotsCached();
  const byPanel = Object.fromEntries(snapshots.map((s) => [s.panel, s]));
  const configured = {
    key: Boolean(serviceAccount(process.env)),
    ga4: ga4Configured(process.env),
    gsc: Boolean(siteUrl(process.env)),
  };

  return (
    <AdminPage
      title="How the site is doing"
      width="max-w-6xl"
      intro={(
        <div className="space-y-2">
          <p>
            Written once a night from Google Analytics and Search Console. Every figure is
            a <strong>floor, not attendance</strong>: visitors who decline cookies are measured by
            nothing, and Search Console&rsquo;s own data runs two to three days behind.
          </p>
          {!configured.key ? (
            <p className="text-amber-800">
              No Google service account is configured on this server, so nothing can be collected.
            </p>
          ) : null}
          {configured.key && !configured.ga4 ? (
            <p className="text-amber-800">
              GA4_PROPERTY_ID is not set — it is the numeric property ID, not the G- measurement ID.
            </p>
          ) : null}
        </div>
      )}
    >
      <Panel
        row={byPanel['daily-totals']}
        title="Page views and people, last 28 days"
        note="A day with no row is a day Google returned nothing, not a day with no visitors."
      >
        {(rows) => (
          <Table
            head={['Date', 'Page views', 'People', 'Sessions']}
            rows={rows.slice(-14).reverse().map((r) => (
              <tr key={r.date} className="border-b border-gray-100">
                <td className="py-1 pr-3">{r.date}</td>
                <td className="py-1 pr-3">{num(r.screenPageViews)}</td>
                <td className="py-1 pr-3">{num(r.activeUsers)}</td>
                <td className="py-1 pr-3">{num(r.sessions)}</td>
              </tr>
            ))}
          />
        )}
      </Panel>

      <Panel
        row={byPanel.events}
        title="What people did"
        note="The twelve interactions the site records. An event at zero is a finding, not a gap."
      >
        {(rows) => (
          <Table
            head={['Event', 'Times']}
            rows={rows.map((r) => (
              <tr key={r.eventName} className="border-b border-gray-100">
                <td className="py-1 pr-3 font-mono text-xs">{r.eventName}</td>
                <td className="py-1 pr-3">{num(r.eventCount)}</td>
              </tr>
            ))}
          />
        )}
      </Panel>

      <Panel
        row={byPanel['top-pages']}
        title="Most-read pages"
        note="Language is taken from the page address, not from the reader's browser setting."
      >
        {(rows) => (
          <Table
            head={['Page', 'Language', 'Views', 'People']}
            rows={rows.map((r) => (
              <tr key={r.pagePath} className="border-b border-gray-100">
                <td className="py-1 pr-3">{r.pagePath}</td>
                <td className="py-1 pr-3">{r.locale}</td>
                <td className="py-1 pr-3">{num(r.screenPageViews)}</td>
                <td className="py-1 pr-3">{num(r.activeUsers)}</td>
              </tr>
            ))}
          />
        )}
      </Panel>

      <Panel
        row={byPanel.queries}
        title="What people searched for"
        note="From Search Console, over the 28 days ending three days ago."
      >
        {(rows) => (
          <Table
            head={['Query', 'Clicks', 'Impressions', 'Average position']}
            rows={rows.slice(0, 40).map((r) => (
              <tr key={r.query} className="border-b border-gray-100">
                <td className="py-1 pr-3">{r.query}</td>
                <td className="py-1 pr-3">{num(r.clicks)}</td>
                <td className="py-1 pr-3">{num(r.impressions)}</td>
                <td className="py-1 pr-3">{r.position ? r.position.toFixed(1) : '—'}</td>
              </tr>
            ))}
          />
        )}
      </Panel>

      <Panel
        row={byPanel.sitemaps}
        title="Sitemap"
        note="Google publishes no API for the Page indexing report, so this is the sitemap's own error and warning counts."
      >
        {(rows) => (
          <>
            <Table
              head={['Sitemap', 'Errors', 'Warnings', 'Last read by Google']}
              rows={rows.map((r) => (
                <tr key={r.path} className="border-b border-gray-100">
                  <td className="py-1 pr-3 break-all">{r.path}</td>
                  <td className="py-1 pr-3">{num(r.errors)}</td>
                  <td className="py-1 pr-3">{num(r.warnings)}</td>
                  <td className="py-1 pr-3">{r.lastDownloaded ? r.lastDownloaded.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            />
            <p className="text-xs text-gray-600">
              For indexing coverage itself, open{' '}
              <Link className="text-blue-900 underline" href="https://search.google.com/search-console">Search Console</Link>.
            </p>
          </>
        )}
      </Panel>
    </AdminPage>
  );
}
