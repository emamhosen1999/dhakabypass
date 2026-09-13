import Link from 'next/link';
import { listCorridorAction, setIllustrativeAction, saveCorridorFactsAction } from './actions';
import { LOCALES } from '../../../../lib/i18n/locales';
import { listWaypointsForAdmin } from '../../../../lib/corridor/waypoints-admin';
import { getGeometryOverview } from '../../../../lib/corridor/geometry-admin';
import { listTollMatrixAction } from './toll-matrix-actions';
import { isProvisional } from '../../../../lib/corridor/toll-matrix';

export const dynamic = 'force-dynamic';

export default async function CorridorHub() {
  const [{ segments, interchanges, tolls, advisories, illustrative, publishedLengthKm, prohibited, roadCode }, waypoints, geometry, matrix] =
    await Promise.all([
      listCorridorAction(), listWaypointsForAdmin(), getGeometryOverview(), listTollMatrixAction(),
    ]);
  // Counted here rather than shown as a bare total: "270 fares" reads as work
  // finished, and the number that matters on this hub is how many of them are
  // still computed figures awaiting a gazette citation.
  const tollMatrixProvisional = matrix.fares.filter(isProvisional).length;

  const areas = [
    { href: '/admin/corridor/waypoints', name: 'Waypoints', count: waypoints.length,
      note: 'The surveyed points that name every stretch of road. An unnamed one is published as “Waypoint 4”.' },
    { href: '/admin/corridor/geometry', name: 'Alignment', count: `${geometry.points} points`,
      note: 'The centreline the public map draws. Replaced whole, and only when it passes both acceptance tests.' },
    { href: '/admin/corridor/sections', name: 'Section traffic', count: '',
      note: 'Current conditions and average speeds, with deliberate publication controls.' },
    { href: '/admin/corridor/monthly', name: 'Monthly traffic', count: '',
      note: 'Add, edit and remove the vehicle counts recorded at toll plazas.' },
    { href: '/admin/corridor/segments', name: 'Segments', count: segments.length,
      note: 'Which stretches are open, under construction or planned. The published progress figure is calculated from these.' },
    { href: '/admin/corridor/interchanges', name: 'Interchanges', count: interchanges.length,
      note: 'Entry and exit points, toll plazas and service areas.' },
    { href: '/admin/corridor/tolls', name: 'Toll rates', count: tolls.length,
      note: 'Rates by vehicle class. The public page shows only the rate in force today.' },
    { href: '/admin/corridor/toll-matrix', name: 'Toll fare matrix', count: `${tollMatrixProvisional} provisional`,
      note: 'Entry-to-exit fares by plaza pair, direction and vehicle class. Seeded from DBEDC’s own published formula; a fare is confirmed by entering its S.R.O. citation.' },
    { href: '/admin/corridor/advisories', name: 'Advisories', count: advisories.length,
      note: 'Closures and notices. The most severe active one appears site-wide.' },
  ];

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Corridor data</h1>
        <p className="text-sm text-gray-500">The operational figures behind the Travel Info pages.</p>
      </header>

      <form action={setIllustrativeAction} className="border rounded p-4 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="illustrative" defaultChecked={illustrative} />
          Mark this data as provisional
        </label>
        <p className="text-sm text-gray-500">
          While this is on, every page showing operational figures carries a notice that
          they await official confirmation. Turn it off only once DBEDC has confirmed the
          toll table, the interchange schedule and the section statuses.
        </p>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">Save</button>
      </form>

      <form action={saveCorridorFactsAction} className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Corridor facts</h2>
        <label className="flex flex-col gap-1 text-sm max-w-xs">
          Published corridor length (km)
          <input
            type="number" step="0.001" min="0" name="published_length_km"
            defaultValue={publishedLengthKm ?? ''} className="border rounded px-3 py-2"
          />
          <span className="text-gray-500">The figure every progress bar shows as its total (“18 km / 48 km”) and any statistic set to “Corridor length, published”. Blank uses the measured length of the sections.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm max-w-xs">
          National road number
          <input name="road_code" defaultValue={roadCode || ''} maxLength={16} className="border rounded px-3 py-2" />
          <span className="text-gray-500">Shown on the corridor map's title plate, for example N105. Blank shows none.</span>
        </label>
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="text-sm">Vehicles not permitted on the expressway — one per line</legend>
          {LOCALES.map((locale) => (
            <label key={locale} className="flex flex-col gap-1 text-sm">
              {locale.toUpperCase()}
              <textarea
                name={`prohibited_${locale}`} rows={4} className="border rounded px-3 py-2"
                defaultValue={Array.isArray(prohibited?.[locale]) ? prohibited[locale].join('\n') : ''}
              />
            </label>
          ))}
        </fieldset>
        <p className="text-sm text-gray-500">Shown by every “Prohibited vehicles” block. A language left blank shows the English list.</p>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">Save</button>
      </form>

      <ul className="grid gap-4 sm:grid-cols-2">
        {areas.map((a) => (
          <li key={a.href} className="border rounded p-4">
            <Link href={a.href} className="font-semibold underline">{a.name}</Link>
            <span className="ml-2 text-sm text-gray-500">{a.count}</span>
            <p className="text-sm text-gray-500 mt-1">{a.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
