import Link from 'next/link';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { listCorridorRoads, mapRoads } from '../../../../../lib/corridor/roads';
import { saveCorridorRoadAction } from '../actions';

export const dynamic = 'force-dynamic';

const input = 'w-full rounded border border-gray-400 px-3 py-2 bg-white text-gray-900';

/**
 * The names and references of the roads the corridor map draws (audit
 * 2.5/2.6). The list of roads comes from the map itself; each one can carry
 * a name per language and an official reference link. A road left blank
 * shows OpenStreetMap's own name and links to its OSM entry.
 */
export default async function CorridorRoadsPage() {
  await assertCan('edit_blocks');
  const [roads, records] = [mapRoads(), await listCorridorRoads()];
  const byKey = new Map(records.map((r) => [r.key, r]));
  const numbered = roads.filter((r) => r.ref);
  const named = roads.filter((r) => !r.ref);

  const Row = ({ road }) => {
    const rec = byKey.get(road.key);
    const id = (f) => `${f}-${road.key}`.replace(/[^A-Za-z0-9_-]/g, '_');
    return (
      <li className="border rounded p-4 space-y-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <strong>{road.ref || road.osmName || road.key}</strong>
          {road.ref && road.osmName ? <span className="text-sm text-gray-600">OpenStreetMap: {road.osmName}</span> : null}
          <span className={`text-xs rounded px-2 py-0.5 ${rec ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-600'}`}>
            {rec ? 'named here' : 'using the OpenStreetMap name'}
          </span>
        </div>
        <form action={saveCorridorRoadAction} className="space-y-3">
          <input type="hidden" name="road_key" value={road.key} />
          <div className="grid gap-3 sm:grid-cols-3">
            {[['en', 'English'], ['bn', 'বাংলা'], ['zh', '中文']].map(([l, label]) => (
              <div key={l}>
                <label className="block text-sm font-semibold mb-1" htmlFor={id(`name-${l}`)}>Name ({label})</label>
                <input id={id(`name-${l}`)} name={`name.${l}`} maxLength={120} defaultValue={rec?.names?.[l] ?? ''} className={input} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor={id('source')}>Reference link (https)</label>
            <input id={id('source')} name="source_url" maxLength={500} defaultValue={rec?.source ?? ''}
              placeholder="https://www.rhd.gov.bd/…" className={input} />
          </div>
          <button type="submit" className="px-4 py-2 rounded bg-black text-white text-sm">Save</button>
          <span className="ml-3 text-xs text-gray-600">Clear every field and save to go back to the OpenStreetMap name.</span>
        </form>
      </li>
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <header className="space-y-1">
        <p className="text-sm"><Link href="/admin/corridor" className="underline">Corridor data</Link></p>
        <h1 className="text-2xl font-bold">Road names</h1>
        <p className="text-sm text-gray-600">
          The highways and roads the corridor map shows. A name here replaces the OpenStreetMap name on the
          public map, in that language; English is used where a language is left blank.
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Numbered roads ({numbered.length})</h2>
        <ul className="space-y-3">{numbered.map((r) => <Row key={r.key} road={r} />)}</ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Other roads ({named.length})</h2>
        <ul className="space-y-3">{named.map((r) => <Row key={r.key} road={r} />)}</ul>
      </section>
    </div>
  );
}
