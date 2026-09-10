import Link from 'next/link';
import { assertCan } from '../../../../../lib/auth/assert-can';
import {
  getGeometryOverview, listGeometryForAdmin, toCoordinateText, checkAlignment,
  GEOMETRY_SOURCES, SOURCE_LABELS, MAX_POINTS, MAX_WAYPOINT_OFFSET_M, MAX_LENGTH_DRIFT, MAX_GAP_M,
} from '../../../../../lib/corridor/geometry-admin';
import { listWaypointsForAdmin } from '../../../../../lib/corridor/waypoints-admin';
import TrafficForm from '../../../../../components/admin/TrafficForm';
import { saveAlignmentAction, clearAlignmentAction } from '../alignment-actions';

export const dynamic = 'force-dynamic';

const input = 'w-full rounded border border-gray-400 px-3 py-2 bg-white text-gray-900';
const km = (metres) => `${(Number(metres) / 1000).toFixed(3)} km`;

export default async function GeometryPage() {
  await assertCan('edit_blocks');
  const [overview, points, waypoints] = await Promise.all([
    getGeometryOverview(), listGeometryForAdmin(), listWaypointsForAdmin(),
  ]);

  // The stored line measured against today's waypoints. Shown rather than
  // hidden: if a waypoint has moved since the import, the operator should be
  // looking at that before pasting anything new.
  const current = points.length >= 2
    ? checkAlignment(points.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })), waypoints)
    : null;
  const source = overview.source?.source || 'waypoints';

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-gray-900">
      <header className="space-y-2">
        <Link href="/admin/corridor" className="text-sm text-blue-900 underline">Corridor data</Link>
        <h1 className="text-3xl font-bold text-blue-900">Corridor alignment</h1>
        <p>
          The centreline the public map draws. It is one fact, so it is replaced whole rather
          than edited point by point — a single moved coordinate silently changes the road&rsquo;s
          shape, the colouring of every section and the map&rsquo;s scale bar at the same time.
        </p>
        <div className="rounded border border-amber-300 bg-amber-50 p-3 space-y-1">
          <p className="font-semibold">Replacing this changes, on the public site:</p>
          <ul className="list-disc pl-5">
            <li>the road drawn on <strong>Travel info → Corridor map</strong>, and its zoom and extent;</li>
            <li>where each section&rsquo;s colour starts and stops — the line is split at every waypoint chainage;</li>
            <li>the scale bar, measured from the line&rsquo;s own first and last point;</li>
            <li>the attribution printed under the map.</li>
          </ul>
          <p>
            It does <strong>not</strong> change chainages on the toll table, the interchange list or the
            segment progress figure. Those come from their own screens.
          </p>
        </div>
      </header>

      <section className="rounded border border-gray-300 bg-white p-5 space-y-3">
        <h2 className="text-xl font-bold">What is stored now</h2>
        <dl className="grid gap-3 sm:grid-cols-4">
          <div><dt className="text-sm font-semibold">Source</dt><dd>{SOURCE_LABELS[source] || source}</dd></div>
          <div><dt className="text-sm font-semibold">Points</dt><dd>{overview.points}</dd></div>
          <div><dt className="text-sm font-semibold">Length</dt><dd>{km(overview.lengthM)}</dd></div>
          <div>
            <dt className="text-sm font-semibold">Imported</dt>
            <dd>{overview.source?.imported_at
              ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' })
                .format(new Date(overview.source.imported_at))
              : '—'}</dd>
          </div>
        </dl>
        <p className="text-sm text-gray-600">
          Attribution: {overview.source?.attribution || <em>none recorded</em>}
        </p>
        {!points.length ? (
          <p className="rounded border border-amber-300 bg-amber-50 p-3">
            No centreline is stored. The map draws a straight polyline through the surveyed
            waypoints and labels itself a schematic — honest, but not the road.
          </p>
        ) : null}
        {current ? (
          <div className="text-sm">
            <p>
              Measured against today&rsquo;s {waypoints.length} waypoints: {km(current.lengthM)} against a
              reference chainage of {km(current.referenceM)} ({current.driftPct}% apart);
              furthest waypoint {Math.max(0, ...current.offsets.map((o) => o.metres))} m from the line.
            </p>
            {current.problems.length ? (
              <ul className="mt-2 list-disc pl-5 text-red-800">
                {current.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            ) : <p className="text-green-800">The stored line still passes both acceptance tests.</p>}
          </div>
        ) : null}
      </section>

      <section className="rounded border border-gray-300 bg-white p-5 space-y-4">
        <h2 className="text-xl font-bold">Replace the alignment</h2>
        <p>
          One point per line, <strong>latitude first, then longitude</strong>. Blank lines and
          lines beginning with <code>#</code> are ignored, and a third column is ignored —
          chainage is measured from the geometry itself, never taken from the paste, so the
          distances the map reports always match the line it draws.
        </p>
        <p className="text-sm text-gray-600">
          Nothing is stored unless the line passes both of the tests
          <code className="mx-1">scripts/import-corridor-geometry.mjs</code> already applies: its length
          must be within {MAX_LENGTH_DRIFT * 100}% of the reference chainage, and every surveyed
          waypoint must lie within {MAX_WAYPOINT_OFFSET_M} m of it. No two consecutive points may be
          more than {(MAX_GAP_M / 1000).toFixed(0)} km apart, and the line is limited to {MAX_POINTS} points.
          A refusal lists every failure and leaves the corridor exactly as it is.
        </p>

        <TrafficForm action={saveAlignmentAction} submitLabel="Replace the alignment">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-1" htmlFor="source">Where it came from</label>
              <select id="source" name="source" defaultValue={GEOMETRY_SOURCES.includes(source) ? source : 'survey'} className={input}>
                {GEOMETRY_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" htmlFor="attribution">Attribution</label>
              <input id="attribution" name="attribution" maxLength={191}
                defaultValue={overview.source?.attribution || ''}
                placeholder="© OpenStreetMap contributors" className={input} />
              <p className="mt-1 text-xs text-gray-600">Printed under the public map. Required for OpenStreetMap data.</p>
            </div>
          </div>

          <label className="block text-sm font-semibold" htmlFor="coordinates">
            Coordinates ({points.length} stored)
          </label>
          <textarea id="coordinates" name="coordinates" rows={14} spellCheck={false}
            defaultValue={toCoordinateText(points)}
            className={`${input} font-mono text-xs`} />

          <label className="flex items-start gap-2">
            <input type="checkbox" name="confirm" className="mt-1" />
            <span>
              I have checked these coordinates against the surveyed alignment, and I understand
              this redraws the public corridor map.
            </span>
          </label>
        </TrafficForm>
      </section>

      {points.length ? (
        <section className="rounded border border-gray-300 bg-white p-5 space-y-4">
          <h2 className="text-xl font-bold">Remove the centreline</h2>
          <p>
            The map then draws a straight polyline through the surveyed waypoints and labels
            itself a schematic. Use this only when the stored line is known to be wrong and no
            replacement is ready — a schematic that says so is better than a road in the wrong place.
          </p>
          <TrafficForm action={clearAlignmentAction} submitLabel="Remove the centreline" danger>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="confirm" className="mt-1" />
              <span>Remove all {points.length} points and return the map to the waypoint schematic.</span>
            </label>
          </TrafficForm>
        </section>
      ) : null}

      <p>
        <Link href="/admin/corridor/waypoints" className="text-blue-900 underline">
          Edit the surveyed waypoints →
        </Link>
      </p>
    </div>
  );
}
