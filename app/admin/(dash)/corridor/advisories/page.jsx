import { listCorridorAction, saveAdvisoryAction, deleteAdvisoryAction } from '../actions';

export const dynamic = 'force-dynamic';

const SEVERITIES = ['info', 'warning', 'closure'];

function toLocalInput(value) {
  if (!value) return '';
  return String(value).slice(0, 16).replace(' ', 'T');
}

function AdvisoryForm({ advisory }) {
  return (
    <form action={saveAdvisoryAction} className="grid gap-2 sm:grid-cols-3 items-end border-t py-3">
      <input type="hidden" name="id" value={advisory?.id ?? ''} />
      <label className="flex flex-col text-sm">Severity
        <select name="severity" defaultValue={advisory?.severity ?? 'info'} className="border rounded px-2 py-1">
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">Starts
        <input name="starts_at" type="datetime-local" defaultValue={toLocalInput(advisory?.starts_at)} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Ends
        <input name="ends_at" type="datetime-local" defaultValue={toLocalInput(advisory?.ends_at)} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm sm:col-span-3">Message (EN)
        <textarea name="message.en" required defaultValue={advisory?.messages?.en ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm sm:col-span-3">Message (BN)
        <textarea name="message.bn" defaultValue={advisory?.messages?.bn ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm sm:col-span-3">Message (ZH)
        <textarea name="message.zh" defaultValue={advisory?.messages?.zh ?? ''} className="border rounded px-2 py-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={advisory ? Boolean(advisory.is_active) : true} />
        Active
      </label>
      <button type="submit" className="px-3 py-1 rounded bg-black text-white h-8">Save</button>
    </form>
  );
}

export default async function AdvisoriesAdmin() {
  const { advisories } = await listCorridorAction();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Advisories</h1>
        <p className="text-sm text-gray-500">
          The most severe active advisory appears at the top of every page. Leave both
          dates blank for a notice that stays until you switch it off.
        </p>
      </header>

      {advisories.map((a) => (
        <div key={a.id}>
          <AdvisoryForm advisory={a} />
          <form action={deleteAdvisoryAction}>
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="text-red-600 text-sm">Delete this advisory</button>
          </form>
        </div>
      ))}

      <div>
        <h2 className="font-semibold">Add an advisory</h2>
        <AdvisoryForm />
      </div>
    </div>
  );
}
