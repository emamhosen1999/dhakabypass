import { listCorridorAction, saveSegmentAction, deleteSegmentAction } from '../actions';
import { formatChainage } from '../../../../../lib/corridor/chainage';

export const dynamic = 'force-dynamic';

const STATUSES = ['open', 'construction', 'planned'];

function SegmentForm({ segment }) {
  return (
    <form action={saveSegmentAction} className="grid gap-2 sm:grid-cols-6 items-end border-t py-3">
      <input type="hidden" name="id" value={segment?.id ?? ''} />
      <label className="flex flex-col text-sm">From
        <input name="from_m" required defaultValue={segment ? formatChainage(segment.from_m) : ''}
          placeholder="K0+000" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">To
        <input name="to_m" required defaultValue={segment ? formatChainage(segment.to_m) : ''}
          placeholder="K48+000" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Status
        <select name="status" defaultValue={segment?.status ?? 'planned'} className="border rounded px-2 py-1">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">Opened
        <input type="date" name="opened_on"
          defaultValue={segment?.opened_on ? String(segment.opened_on).slice(0, 10) : ''}
          className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Label (EN)
        <input name="label.en" defaultValue={segment?.labels?.en ?? ''} className="border rounded px-2 py-1" />
      </label>
      <button type="submit" className="px-3 py-1 rounded bg-black text-white h-8">Save</button>
    </form>
  );
}

export default async function SegmentsAdmin() {
  const { segments } = await listCorridorAction();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Segments</h1>
        <p className="text-sm text-gray-500">
          Chainage may be entered as K3+900 or as a plain number of metres. Segments may
          touch but must not overlap. The published progress figure is calculated from
          these rows — it is never typed in.
        </p>
      </header>

      {segments.map((s) => (
        <div key={s.id}>
          <SegmentForm segment={s} />
          <form action={deleteSegmentAction}>
            <input type="hidden" name="id" value={s.id} />
            <button type="submit" className="text-red-600 text-sm">Delete this segment</button>
          </form>
        </div>
      ))}

      <div>
        <h2 className="font-semibold">Add a segment</h2>
        <SegmentForm />
      </div>
    </div>
  );
}
