import Link from 'next/link';
import { listCorridorAction, setIllustrativeAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function CorridorHub() {
  const { segments, interchanges, tolls, advisories, illustrative } = await listCorridorAction();

  const areas = [
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
