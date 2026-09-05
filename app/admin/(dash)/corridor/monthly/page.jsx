import Link from 'next/link';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { listMonthlyForAdmin } from '../../../../../lib/corridor/traffic-admin';
import { getMonthlyTrafficSource } from '../../../../../lib/corridor/traffic';
import TrafficForm from '../../../../../components/admin/TrafficForm';
import { saveMonthlyAction, deleteMonthlyAction } from '../traffic-actions';

export const dynamic = 'force-dynamic';

function Fields({ row, suffix }) {
  const input = 'w-full rounded border border-gray-400 px-3 py-2 bg-white text-gray-900';
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="id" value={row?.id || ''} />
      <div><label className="block text-sm font-semibold mb-1" htmlFor={`month-${suffix}`}>Month</label><input id={`month-${suffix}`} name="month" type="month" required defaultValue={row?.month || ''} className={input} /></div>
      <div><label className="block text-sm font-semibold mb-1" htmlFor={`plaza-${suffix}`}>Plaza code</label><input id={`plaza-${suffix}`} name="plaza" required maxLength={32} defaultValue={row?.plaza || 'all'} className={input} /></div>
      <div><label className="block text-sm font-semibold mb-1" htmlFor={`vehicles-${suffix}`}>Vehicles</label><input id={`vehicles-${suffix}`} name="vehicles" type="number" min="0" max="2147483647" step="1" required defaultValue={row?.vehicles ?? ''} className={input} /></div>
    </div>
  );
}

export default async function MonthlyPage() {
  await assertCan('edit_blocks');
  const [rows, source] = await Promise.all([listMonthlyForAdmin(), getMonthlyTrafficSource()]);
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-gray-900">
      <header className="space-y-2">
        <Link href="/admin/corridor" className="text-sm text-blue-900 underline">Corridor data</Link>
        <h1 className="text-3xl font-bold text-blue-900">Monthly traffic</h1>
        <p>Enter the vehicle count recorded at each toll plaza. Use <strong>all</strong> for the confirmed corridor total shown on the public chart. Plaza rows are stored separately and are not added together automatically.</p>
        <p className="rounded border border-amber-300 bg-amber-50 p-3">Monthly data source: <strong>{source}</strong>. <Link className="underline" href="/admin/corridor/sections">Review publication settings</Link>.</p>
      </header>
      <section className="rounded border border-gray-300 bg-white p-5 space-y-4">
        <h2 className="text-xl font-bold">Add a month</h2>
        <TrafficForm action={saveMonthlyAction} submitLabel="Add monthly count"><Fields suffix="new" /></TrafficForm>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Recorded counts <span className="text-gray-600">({rows.length})</span></h2>
        {!rows.length ? <p>No monthly counts yet.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="rounded border border-gray-300 bg-white p-5 space-y-4">
            <h3 className="font-bold">{row.month} · {row.plaza}</h3>
            <TrafficForm action={saveMonthlyAction} submitLabel="Save monthly count"><Fields row={row} suffix={row.id} /></TrafficForm>
            <details><summary className="cursor-pointer text-sm text-red-800">Remove this count</summary>
              <TrafficForm action={deleteMonthlyAction} submitLabel="Delete monthly count" danger className="pt-3">
                <input type="hidden" name="id" value={row.id} />
                <p className="text-sm">Remove the {row.month} count for {row.plaza} from the published data.</p>
              </TrafficForm>
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}
