import Link from 'next/link';
import { listCorridorAction, setIllustrativeAction, saveCorridorFactsAction, listWeatherThresholdsAction, saveWeatherThresholdsAction } from './actions';
import { LOCALES } from '../../../../lib/i18n/locales';
import { listWaypointsForAdmin } from '../../../../lib/corridor/waypoints-admin';
import { getGeometryOverview } from '../../../../lib/corridor/geometry-admin';
import { listTollMatrixAction } from './toll-matrix-actions';
import { isProvisional } from '../../../../lib/corridor/toll-matrix';
import { AdminPage, Button } from '../../../../components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function CorridorHub() {
  const [{ segments, interchanges, tolls, advisories, illustrative, publishedLengthKm, prohibited, roadCode }, waypoints, geometry, matrix, weather] =
    await Promise.all([
      listCorridorAction(), listWaypointsForAdmin(), getGeometryOverview(), listTollMatrixAction(), listWeatherThresholdsAction(),
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
    { href: '/admin/corridor/cameras', name: 'Traffic cameras', count: '',
      note: 'CCTV stills and live streams shown on the travel cameras page, with a connection test.' },
    { href: '/admin/corridor/roads', name: 'Road names', count: '',
      note: 'The names and references of the highways the map shows, in each language.' },
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
    <AdminPage title="Corridor data"
      intro={(
        <>
          <p className="text-sm text-gray-500">The operational figures behind the Travel Info pages.</p>
        </>
      )}>

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
        {illustrative ? (
          <label className="flex items-center gap-2 text-sm text-red-900">
            <input type="checkbox" name="confirm_real" />
            DBEDC has confirmed the toll table, the interchange schedule and the section statuses (needed to turn the notice off)
          </label>
        ) : null}
        <div className="flex items-center gap-3">
          <Button data-noconfirm="">Save</Button>
          <a href="/admin/history?type=setting&id=corridor.illustrative" className="text-sm underline text-blue-900">History</a>
        </div>
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
        <Button>Save</Button>
      </form>

      <form action={saveWeatherThresholdsAction} className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Weather advisory thresholds</h2>
        <p className="text-sm text-gray-500">
          The corridor-weather block reads Open-Meteo at the two ends of the road and its middle, and
          raises an advisory when a reading crosses one of these. Blank puts a figure back to its default.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Fog: visibility below (metres)
            <input type="number" min="50" max="20000" step="50" name="weather_fog" defaultValue={weather.fog} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Heavy rain: at or above (mm in the last hour)
            <input type="number" min="0.5" max="200" step="0.5" name="weather_rain" defaultValue={weather.rain} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Strong wind: at or above (km/h, gusts included)
            <input type="number" min="10" max="200" step="1" name="weather_wind" defaultValue={weather.wind} className="border rounded px-3 py-2" />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button>Save</Button>
          <a href="/admin/history?type=setting&id=weather.fog_visibility_m" className="text-sm underline text-blue-900">History</a>
        </div>
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
    </AdminPage>
  );
}
