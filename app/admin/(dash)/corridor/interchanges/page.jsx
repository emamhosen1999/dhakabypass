import { listCorridorAction, saveInterchangeAction, deleteInterchangeAction } from '../actions';
import { formatChainage } from '../../../../../lib/corridor/chainage';

export const dynamic = 'force-dynamic';

const KINDS = ['interchange', 'toll_plaza', 'service_area', 'u_loop', 'pedestrian_overpass'];
const STATUSES = ['open', 'construction', 'planned'];

function InterchangeForm({ interchange }) {
  return (
    <form action={saveInterchangeAction} className="grid gap-2 sm:grid-cols-4 items-end border-t py-3">
      <input type="hidden" name="id" value={interchange?.id ?? ''} />
      <label className="flex flex-col text-sm">Chainage
        <input name="chainage_m" required
          defaultValue={interchange ? formatChainage(interchange.chainage_m) : ''}
          placeholder="K9+400" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Name (EN)
        <input name="name.en" required defaultValue={interchange?.names?.en ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Name (BN)
        <input name="name.bn" defaultValue={interchange?.names?.bn ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Name (ZH)
        <input name="name.zh" defaultValue={interchange?.names?.zh ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Kind
        <select name="kind" defaultValue={interchange?.kind ?? 'interchange'} className="border rounded px-2 py-1">
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">Status
        <select name="status" defaultValue={interchange?.status ?? 'planned'} className="border rounded px-2 py-1">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">Connects to
        <input name="connects_to" defaultValue={interchange?.connects_to ?? ''}
          placeholder="N2 · Dhaka–Sylhet" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Facilities
        <input name="facilities" defaultValue={(interchange?.facilities ?? []).join(', ')}
          placeholder="Fuel, Toilets, Food" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Latitude
        <input name="lat" type="number" step="0.0000001" defaultValue={interchange?.lat ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Longitude
        <input name="lng" type="number" step="0.0000001" defaultValue={interchange?.lng ?? ''} className="border rounded px-2 py-1" />
      </label>
      <button type="submit" className="px-3 py-1 rounded bg-black text-white h-8">Save</button>
    </form>
  );
}

export default async function InterchangesAdmin() {
  const { interchanges } = await listCorridorAction();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Interchanges</h1>
        <p className="text-sm text-gray-500">
          Entry and exit points, toll plazas and service areas. Latitude and longitude may
          be left blank until survey data arrives.
        </p>
      </header>

      {interchanges.map((i) => (
        <div key={i.id}>
          <InterchangeForm interchange={i} />
          <form action={deleteInterchangeAction}>
            <input type="hidden" name="id" value={i.id} />
            <button type="submit" className="text-red-600 text-sm">Delete this interchange</button>
          </form>
        </div>
      ))}

      <div>
        <h2 className="font-semibold">Add an interchange</h2>
        <InterchangeForm />
      </div>
    </div>
  );
}
