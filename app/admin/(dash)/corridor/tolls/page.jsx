import { listCorridorAction, saveTollRateAction, deleteTollRateAction } from '../actions';

export const dynamic = 'force-dynamic';

function TollForm({ toll }) {
  return (
    <form action={saveTollRateAction} className="grid gap-2 sm:grid-cols-4 items-end border-t py-3">
      <input type="hidden" name="id" value={toll?.id ?? ''} />
      <label className="flex flex-col text-sm">Vehicle class (key)
        <input name="vehicle_class" required defaultValue={toll?.vehicle_class ?? ''}
          placeholder="car" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Class (EN)
        <input name="class.en" required defaultValue={toll?.class_labels?.en ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Class (BN)
        <input name="class.bn" defaultValue={toll?.class_labels?.bn ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Class (ZH)
        <input name="class.zh" defaultValue={toll?.class_labels?.zh ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Order
        <input name="class_order" type="number" defaultValue={toll?.class_order ?? 0} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Section
        <input name="section" defaultValue={toll?.section ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Amount (BDT)
        <input name="amount_bdt" type="number" step="0.01" min="0" required
          defaultValue={toll?.amount_bdt ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Effective from
        <input name="effective_from" type="date" required
          defaultValue={toll?.effective_from ? String(toll.effective_from).slice(0, 10) : ''}
          className="border rounded px-2 py-1" />
      </label>
      <button type="submit" className="px-3 py-1 rounded bg-black text-white h-8">Save</button>
    </form>
  );
}

export default async function TollsAdmin() {
  const { tolls } = await listCorridorAction();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Toll rates</h1>
        <p className="text-sm text-gray-500">
          The public table shows only the rate in force today. To schedule a change, add a
          new row for the same vehicle class with a future effective date — do not edit the
          current one.
        </p>
      </header>

      {tolls.map((t) => (
        <div key={t.id}>
          <TollForm toll={t} />
          <form action={deleteTollRateAction}>
            <input type="hidden" name="id" value={t.id} />
            <button type="submit" className="text-red-600 text-sm">Delete this rate</button>
          </form>
        </div>
      ))}

      <div>
        <h2 className="font-semibold">Add a toll rate</h2>
        <TollForm />
      </div>
    </div>
  );
}
