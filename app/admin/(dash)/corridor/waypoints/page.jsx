import Link from 'next/link';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { listWaypointsForAdmin, sectionsByWaypoint } from '../../../../../lib/corridor/waypoints-admin';
import { formatChainage } from '../../../../../lib/corridor/chainage';
import TrafficForm from '../../../../../components/admin/TrafficForm';
import { saveWaypointAction, deleteWaypointAction } from '../alignment-actions';

export const dynamic = 'force-dynamic';

const input = 'w-full rounded border border-gray-400 px-3 py-2 bg-white text-gray-900';

/**
 * `names` is a JSON column, which mysql2 hands back either parsed or as a
 * string depending on the driver and the server, and it is NULL for six of the
 * eight waypoints on this corridor. All three cases resolve, none throws — the
 * same rule lib/blocks/trafficStatus.js applies to the same column.
 */
function readNames(value) {
  if (!value) return {};
  let names = value;
  if (typeof names === 'string') {
    try { names = JSON.parse(names); } catch { return {}; }
  }
  return names && typeof names === 'object' && !Array.isArray(names) ? names : {};
}

function Fields({ row, names, suffix }) {
  const id = (field) => `${field}-${suffix}`;
  return (
    <>
      <input type="hidden" name="id" value={row?.id ?? ''} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor={id('name-en')}>Name (English)</label>
          <input id={id('name-en')} name="name.en" maxLength={120} defaultValue={names.en ?? ''}
            placeholder="Bhulta" className={input} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor={id('name-bn')}>Name (বাংলা)</label>
          <input id={id('name-bn')} name="name.bn" maxLength={120} defaultValue={names.bn ?? ''} className={input} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor={id('name-zh')}>Name (中文)</label>
          <input id={id('name-zh')} name="name.zh" maxLength={120} defaultValue={names.zh ?? ''} className={input} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor={id('code')}>Code</label>
          <input id={id('code')} name="code" required maxLength={8} pattern="[A-Za-z0-9]{1,8}"
            defaultValue={row?.code ?? ''} readOnly={Boolean(row)}
            className={`${input} ${row ? 'bg-gray-100 text-gray-700' : ''}`} />
          {row ? <p className="mt-1 text-xs text-gray-600">Permanent. Sections refer to it.</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor={id('chainage')}>Chainage</label>
          <input id={id('chainage')} name="chainage_m" required
            defaultValue={row ? formatChainage(Number(row.chainage_m)) : ''}
            placeholder="K12+090" className={input} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor={id('lat')}>Latitude</label>
          <input id={id('lat')} name="lat" required inputMode="decimal" defaultValue={row?.lat ?? ''}
            placeholder="23.9302110" className={input} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor={id('lng')}>Longitude</label>
          <input id={id('lng')} name="lng" required inputMode="decimal" defaultValue={row?.lng ?? ''}
            placeholder="90.4526550" className={input} />
        </div>
      </div>
      <div className="sm:w-40">
        <label className="block text-sm font-semibold mb-1" htmlFor={id('order')}>Sort order</label>
        <input id={id('order')} name="sort_order" type="number" min="0" step="1" required
          defaultValue={row?.sort_order ?? 0} className={input} />
      </div>
    </>
  );
}

export default async function WaypointsPage() {
  await assertCan('edit_blocks');
  const [rows, sections] = await Promise.all([listWaypointsForAdmin(), sectionsByWaypoint()]);
  const unnamed = rows.filter((r) => !readNames(r.names).en).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-gray-900">
      <header className="space-y-2">
        <Link href="/admin/corridor" className="text-sm text-blue-900 underline">Corridor data</Link>
        <h1 className="text-3xl font-bold text-blue-900">Waypoints</h1>
        <p>
          The surveyed points that define the corridor. Their names are what the public
          corridor map prints beside each marker, and what the section traffic table and the
          traffic status block use to say which stretch of road they mean —
          &ldquo;Bhulta → Madanpur&rdquo; rather than &ldquo;Waypoint 4 → Waypoint 5&rdquo;.
        </p>
        <p>
          A waypoint is not a place a driver can leave the road at. Name it after the
          nearest recognisable landmark, not after the junction; entry and exit points
          belong on the <Link className="underline" href="/admin/corridor/interchanges">interchanges</Link> screen.
        </p>
        {unnamed ? (
          <p className="rounded border border-amber-300 bg-amber-50 p-3">
            <strong>{unnamed}</strong> of {rows.length} waypoints have no English name, so the map and the
            traffic table currently call each of them &ldquo;Waypoint&nbsp;<em>code</em>&rdquo;. Naming one here
            changes every public page that mentions it.
          </p>
        ) : null}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          The corridor, north to south <span className="text-gray-600">({rows.length})</span>
        </h2>
        {!rows.length ? <p>No waypoints have been surveyed yet.</p> : null}

        {rows.map((row) => {
          const names = readNames(row.names);
          const used = sections[row.code] || [];
          return (
            <article key={row.id} className="rounded border border-gray-300 bg-white p-5 space-y-4">
              <div>
                <h3 className="font-bold text-lg">
                  {names.en || `Waypoint ${row.code}`}{' '}
                  <span className="font-normal text-gray-600">· {row.code} · {formatChainage(Number(row.chainage_m))}</span>
                </h3>
                <p className="text-sm text-gray-600">
                  {used.length
                    ? `Defines corridor ${used.length === 1 ? 'section' : 'sections'} ${used.join(', ')}.`
                    : 'No corridor section refers to this waypoint.'}
                  {names.en ? '' : ' Unnamed: published as “Waypoint ' + row.code + '” in all three languages.'}
                </p>
              </div>

              <TrafficForm action={saveWaypointAction} submitLabel="Save waypoint">
                <Fields row={row} names={names} suffix={row.id} />
                <p className="text-sm text-gray-600">
                  Leave all three names empty to publish this point as &ldquo;Waypoint {row.code}&rdquo; again.
                  A name in Bengali or Chinese also needs the English one: every other language falls back to it.
                </p>
              </TrafficForm>

              <details>
                <summary className="cursor-pointer text-sm text-red-800">Remove this waypoint</summary>
                <TrafficForm action={deleteWaypointAction} submitLabel="Delete waypoint" danger className="pt-3">
                  <input type="hidden" name="id" value={row.id} />
                  <p className="text-sm">
                    {used.length
                      ? `Waypoint ${row.code} still defines ${used.join(', ')}. Remove those sections first — this will be refused.`
                      : `Removes waypoint ${row.code} from the map and from the alignment the centreline is checked against.`}
                  </p>
                </TrafficForm>
              </details>
            </article>
          );
        })}
      </section>

      <section className="rounded border border-gray-300 bg-white p-5 space-y-4">
        <h2 className="text-xl font-bold">Add a waypoint</h2>
        <p className="text-sm text-gray-600">
          Only after a new survey. A waypoint on its own draws a marker and splits the map&rsquo;s
          colouring at its chainage; it carries traffic conditions only once a corridor section
          names it as an endpoint.
        </p>
        <TrafficForm action={saveWaypointAction} submitLabel="Add waypoint">
          <Fields names={{}} suffix="new" />
        </TrafficForm>
      </section>

      <p>
        <Link href="/admin/corridor/geometry" className="text-blue-900 underline">
          Edit the drawn centreline →
        </Link>
      </p>
    </div>
  );
}
