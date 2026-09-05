import Link from 'next/link';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { can } from '../../../../../lib/auth/roles';
import { listCorridorSections, listCorridorWaypoints, getTrafficSource, getMonthlyTrafficSource } from '../../../../../lib/corridor/traffic';
import { CONDITIONS, CONDITION_LABELS } from '../../../../../lib/corridor/traffic-admin';
import TrafficForm from '../../../../../components/admin/TrafficForm';
import { saveSectionAction, saveTrafficSourcesAction, refreshTrafficAction } from '../traffic-actions';

export const dynamic = 'force-dynamic';
const input = 'w-full border border-gray-400 rounded px-3 py-2 bg-white text-gray-900';

export default async function SectionsPage() {
  const session = await assertCan('edit_blocks');
  const [sections, waypoints, source, monthlySource] = await Promise.all([
    listCorridorSections(), listCorridorWaypoints(), getTrafficSource(), getMonthlyTrafficSource(),
  ]);
  const name = (code) => {
    const row = waypoints.find((w) => w.code === code);
    try { return (typeof row?.names === 'string' ? JSON.parse(row.names) : row?.names)?.en || `Waypoint ${code}`; }
    catch { return `Waypoint ${code}`; }
  };
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-gray-900">
      <header className="space-y-2">
        <Link href="/admin/corridor" className="text-sm text-blue-900 underline">Corridor data</Link>
        <h1 className="text-3xl font-bold text-blue-900">Section traffic conditions</h1>
        <p>Update each section after checking the road. Leave speed empty when it has not been measured.</p>
        <p className="rounded border border-amber-300 bg-amber-50 p-3">Current traffic source: <strong>{source}</strong>. Saving a measurement does not remove the sample notice.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <TrafficForm key={s.id} action={saveSectionAction} submitLabel="Save section" className="rounded border border-gray-300 bg-white p-5">
            <h2 className="font-bold text-lg">{name(s.from_code)} → {name(s.to_code)}</h2>
            <p className="text-sm text-gray-600">{s.measured_at ? `Last recorded: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }).format(new Date(s.measured_at))} (Dhaka)` : 'No measurement recorded'}</p>
            <input type="hidden" name="id" value={s.id} />
            <label className="block text-sm font-semibold" htmlFor={`condition-${s.id}`}>Condition</label>
            <select id={`condition-${s.id}`} name="condition_key" defaultValue={s.condition_key} className={input}>
              {CONDITIONS.map((key) => <option key={key} value={key}>{CONDITION_LABELS[key]}</option>)}
            </select>
            <label className="block text-sm font-semibold" htmlFor={`speed-${s.id}`}>Average speed (km/h)</label>
            <input id={`speed-${s.id}`} name="avg_speed_kmh" type="number" min="0" max="250" step="1" defaultValue={s.avg_speed_kmh ?? ''} className={input} />
          </TrafficForm>
        ))}
      </div>
      {!sections.length ? <p>No corridor sections have been registered yet.</p> : null}
      {can(session.user.role, 'manage_users') ? (
        <section className="rounded border border-gray-300 bg-white p-5 space-y-4">
          <h2 className="text-xl font-bold">Publish real traffic data</h2>
          <p>Review every section and every monthly row before removing a sample notice. Monthly counts are confirmed separately from current road conditions.</p>
          <TrafficForm action={saveTrafficSourcesAction} submitLabel="Save data sources">
            <label className="block font-semibold" htmlFor="traffic_source">Section data source</label>
            <select id="traffic_source" name="traffic_source" defaultValue={source} className={input}>
              <option value="sample">Sample — keep the notice</option>
              <option value="operator">Operator — reviewed measurements</option>
              {source==='tomtom'?<option value="tomtom">TomTom — keep the active feed</option>:null}
            </select>
            <label className="flex items-start gap-2"><input type="checkbox" name="confirm_sections" className="mt-1" />All section measurements have been checked against real operator data.</label>
            <label className="block font-semibold" htmlFor="monthly_source">Monthly count source</label>
            <select id="monthly_source" name="monthly_source" defaultValue={monthlySource} className={input}>
              <option value="sample">Sample — keep the notice</option>
              <option value="operator">Operator — confirmed plaza counts</option>
            </select>
            <label className="flex items-start gap-2"><input type="checkbox" name="confirm_monthly" className="mt-1" />All monthly rows contain real counts; any sample rows have been removed.</label>
          </TrafficForm>
          <p className="text-sm text-gray-600">TomTom becomes the section source only after a successful traffic refresh.</p>
          <TrafficForm action={refreshTrafficAction} submitLabel="Refresh from TomTom">
            <h3 className="font-bold">TomTom traffic</h3>
            <p>{process.env.TOMTOM_API_KEY?'API key configured. Refresh all sections from TomTom.':'Add TOMTOM_API_KEY to the server environment to enable the traffic feed.'}</p>
            <p className="text-sm text-gray-600">Each section uses a sample on its road alignment. All measurements must pass validation before the source changes. Readings expire after 15 minutes.</p>
          </TrafficForm>
        </section>
      ) : <p>An administrator can confirm data sources after review.</p>}
      <Link href="/admin/corridor/monthly" className="inline-block text-blue-900 underline">Edit monthly traffic counts →</Link>
    </div>
  );
}
