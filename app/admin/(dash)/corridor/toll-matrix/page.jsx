import {
  listTollMatrixAction, saveTollOdRateAction, deleteTollOdRateAction,
} from '../toll-matrix-actions';
import { formatChainage } from '../../../../../lib/corridor/chainage';
import { isProvisional } from '../../../../../lib/corridor/toll-matrix';

export const dynamic = 'force-dynamic';

const DIRECTIONS = ['southbound', 'northbound'];

/**
 * The origin–destination fare matrix, edited as RECORDS.
 *
 * Same structure and the same classes as the interchanges and tolls screens
 * beside it: one form per row, a delete beneath it, and an add form at the
 * bottom. Deliberately plain — this is operational data entry, not a block
 * editor.
 *
 * THERE IS NO "CONFIRMED" CHECKBOX, and there must never be one. A fare stops
 * being provisional by acquiring the gazette citation that makes it
 * authoritative: `is_provisional` is a generated column over `sro_number`
 * (db/sql/12-toll-od-matrix.sql), so a checkbox here would be a control the
 * database refuses to honour. The two citation fields ARE the confirm
 * control, which is why they sit on every row rather than in a corner.
 */

/**
 * A value an <input type="date"> will actually show.
 *
 * mysql2 returns a DATE column as a JS Date, and `String(date).slice(0, 10)`
 * — the expression the tolls and segments screens beside this one use —
 * produces "Wed Aug 20", which the input rejects and renders as empty. An
 * operator then saves the row and is told an effective date is required, on a
 * row that has one. Both those screens have the same defect today; it is
 * reported rather than fixed here, because it belongs to their task, not this
 * one.
 */
function dateValue(value) {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    // LOCAL parts, not toISOString(). mysql2 builds a DATE as local midnight,
    // and the server runs at UTC+6, so toISOString() shifts it back into the
    // previous day — an effective date of 2025-08-23 renders as 2025-08-22,
    // and saving the form silently moves the fare a day earlier.
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}

function plazaName(points, id) {
  const p = points.find((x) => x.id === id);
  return p ? `${p.names?.en || `#${p.id}`} · ${formatChainage(p.chainage_m)}` : `#${id}`;
}

function FareForm({ fare, points }) {
  return (
    <form action={saveTollOdRateAction} className="grid gap-2 sm:grid-cols-4 items-end border-t py-3">
      <input type="hidden" name="id" value={fare?.id ?? ''} />
      <label className="flex flex-col text-sm">Entry plaza
        <select name="origin_interchange_id" required
          defaultValue={fare?.origin_interchange_id ?? ''} className="border rounded px-2 py-1">
          <option value="">Choose…</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>{p.names?.en || `#${p.id}`} ({formatChainage(p.chainage_m)})</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm">Exit plaza
        <select name="destination_interchange_id" required
          defaultValue={fare?.destination_interchange_id ?? ''} className="border rounded px-2 py-1">
          <option value="">Choose…</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>{p.names?.en || `#${p.id}`} ({formatChainage(p.chainage_m)})</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm">Carriageway
        <select name="direction" defaultValue={fare?.direction ?? 'southbound'} className="border rounded px-2 py-1">
          {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">Vehicle class (key)
        <input name="vehicle_class" required defaultValue={fare?.vehicle_class ?? ''}
          placeholder="car" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Distance (metres)
        <input name="distance_m" type="number" step="1" min="0" required
          defaultValue={fare?.distance_m ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Fare (BDT)
        <input name="amount_bdt" type="number" step="0.01" min="0" required
          defaultValue={fare?.amount_bdt ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Effective from
        <input name="effective_from" type="date" required
          defaultValue={dateValue(fare?.effective_from)}
          className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">How this figure was produced
        <input name="derivation" defaultValue={fare?.derivation ?? 'gazette'}
          placeholder="gazette" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">S.R.O. number
        <input name="sro_number" defaultValue={fare?.sro_number ?? ''}
          placeholder="S.R.O. 214-Law/2025" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Notification date
        <input name="sro_date" defaultValue={fare?.sro_date ?? ''}
          placeholder="23 August 2025" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Link to the notification
        <input name="sro_link" defaultValue={fare?.sro_link ?? ''} className="border rounded px-2 py-1" />
      </label>
      <button type="submit" className="px-3 py-1 rounded bg-black text-white h-8">Save</button>
    </form>
  );
}

export default async function TollMatrixAdmin() {
  const { fares, points } = await listTollMatrixAction();
  const provisional = fares.filter(isProvisional).length;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Toll fare matrix</h1>
        <p className="text-sm text-gray-500">
          What a driver pays entering at one toll plaza and leaving at another. Each
          direction is its own row, so a southbound fare and the northbound fare for the
          same pair can differ. Distances are in metres between the two plazas&rsquo;
          recorded chainages. To schedule a change, add a new row for the same pair and
          vehicle class with a later effective date — do not edit the current one.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          <strong>{provisional} of {fares.length} fares are provisional.</strong> They were
          computed from the toll formula DBEDC published on the previous website, so the
          calculator could be built before the gazetted matrix exists. Every page showing
          them carries a notice saying so, and that notice cannot be switched off in the
          page editor. A fare stops being provisional when you enter its S.R.O. number and
          the date it was notified — there is no other way to mark one confirmed, and
          entering a number without a date is refused.
        </p>
      </header>

      {fares.map((f) => (
        <div key={f.id}>
          <p className="text-sm font-semibold pt-2">
            {plazaName(points, f.origin_interchange_id)} → {plazaName(points, f.destination_interchange_id)}
            {' · '}{f.vehicle_class}{' '}
            {isProvisional(f) ? <span className="ml-2 text-amber-700">provisional</span>
              : <span className="ml-2 text-green-700">{f.sro_number}</span>}
          </p>
          <FareForm fare={f} points={points} />
          <form action={deleteTollOdRateAction}>
            <input type="hidden" name="id" value={f.id} />
            <button type="submit" className="text-red-600 text-sm">Delete this fare</button>
          </form>
        </div>
      ))}

      <div>
        <h2 className="font-semibold">Add a fare</h2>
        <FareForm points={points} />
      </div>
    </div>
  );
}
