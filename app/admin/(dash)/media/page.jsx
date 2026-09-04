import { assertCan } from '../../../../lib/auth/assert-can';
import { listMedia, mediaAlt } from '../../../../lib/media/repo';
import { replaceMediaAction, setGalleryVisibilityAction } from './actions';
import GuideNotice from './GuideNotice';

export const dynamic = 'force-dynamic';

/**
 * Below this, a photograph used full-width or as the home banner is being
 * stretched past its own detail and reads as soft on any ordinary desktop
 * display. Every single image in the library is under it — the largest
 * registered image is /route.webp at 1108px and the home banner is 686px —
 * so the flag is not an exception report, it is the current state of the
 * whole library.
 *
 * The 1449px map.webp is NOT the largest: scripts/import-legacy-media.mjs's
 * audit rejects it (a Google satellite screenshot), so it is never
 * registered as a media row and never appears on this screen at all.
 */
const SOFT_WIDTH = 1600;

function Row({ row }) {
  const soft = row.width > 0 && row.width < SOFT_WIDTH;
  // Replacing a picture resets its description, because the old sentence
  // describes a photograph that is no longer there (see lib/media/replace.js).
  // An empty alt is therefore its own review flag, and it is shown as one:
  // resetting silently would leave a screen-reader user hearing nothing where
  // they used to hear something, with no sign of it on this screen.
  const described = Boolean(mediaAlt(row, 'en'));
  return (
    <li className="border-b py-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
      <img
        src={row.path}
        alt=""
        width={row.width || undefined}
        height={row.height || undefined}
        className="w-28 h-20 object-cover rounded border bg-gray-100 shrink-0"
      />

      <div className="min-w-0 space-y-1">
        <p className="font-mono text-sm break-all">{row.path}</p>
        <p className="text-sm text-gray-600">
          {row.width > 0 && row.height > 0
            ? `${row.width} × ${row.height} pixels`
            : 'Size unknown'}
          {soft ? (
            <span className="ml-2 inline-block rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-semibold">
              Too small — under {SOFT_WIDTH}px wide
            </span>
          ) : null}
        </p>
        {described ? (
          <p className="text-sm text-gray-600">{mediaAlt(row, 'en')}</p>
        ) : (
          <p className="text-sm text-amber-900">
            <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold">
              No description
            </span>{' '}
            Nobody using a screen reader is told what this picture shows. Send us one
            sentence describing what is in the frame.
          </p>
        )}
        {row.credit ? <p className="text-sm text-gray-500">{row.credit}</p> : null}
        {soft ? (
          <p className="text-sm text-gray-500">
            Fine in a small box; soft anywhere it fills the width of the screen.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        {/* Whether this picture is on the public gallery page. The flag defaults
            to off for every new upload, so a diagram or a logo attached to a
            page block never reaches the gallery by accident — this is where an
            editor opts one in. The button submits the value it wants rather
            than toggling, so a double-click or a retried request cannot land on
            the opposite of what was chosen. */}
        <form action={setGalleryVisibilityAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="show" value={row.inGallery ? '0' : '1'} />
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
              row.inGallery ? 'bg-green-100 text-green-900' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {row.inGallery ? 'In the gallery' : 'Not in the gallery'}
          </span>
          <button type="submit" className="px-3 py-1.5 rounded border text-sm">
            {row.inGallery ? 'Remove from gallery' : 'Add to gallery'}
          </button>
        </form>

      <form action={replaceMediaAction} className="flex flex-wrap items-center gap-2 sm:justify-end">
        <input type="hidden" name="id" value={row.id} />
        <input
          type="file"
          name="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className="text-sm max-w-[220px]"
        />
        <button type="submit" className="px-3 py-1.5 rounded bg-black text-white text-sm">
          Replace
        </button>
      </form>
      </div>
    </li>
  );
}

export default async function MediaLibrary() {
  await assertCan('edit_blocks');

  const all = await listMedia();
  const byPath = (a, b) => a.path.localeCompare(b.path);
  const placeholders = all.filter((m) => m.origin === 'legacy').sort(byPath);
  const uploads = all.filter((m) => m.origin !== 'legacy').sort(byPath);
  const soft = all.filter((m) => m.width > 0 && m.width < SOFT_WIDTH).length;

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Media</h1>
        <p className="text-sm text-gray-500">
          Every picture used anywhere on the new site. Replacing one here updates every
          page that uses it — there is nothing else to edit afterwards.
        </p>
      </header>

      <GuideNotice />

      <section className="space-y-2">
        <h2 className="text-lg font-bold">
          Placeholders — small copies taken from the old website ({placeholders.length})
        </h2>
        <p className="text-sm text-gray-600 max-w-3xl">
          These are DBEDC&rsquo;s own photographs, but they are the small web-sized copies that
          were on the old site, not the originals. They are standing in until the original
          camera files arrive. {soft > 0 ? (
            <>
              {soft} of the {all.length} images in the library are under {SOFT_WIDTH} pixels wide and
              are marked below.
            </>
          ) : null}
        </p>
        {placeholders.length > 0 ? (
          <ul>{placeholders.map((m) => <Row key={m.id} row={m} />)}</ul>
        ) : (
          <p className="text-sm text-gray-500 py-4">
            No placeholders left. Every image on the site is an original upload.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Uploaded images ({uploads.length})</h2>
        <p className="text-sm text-gray-600 max-w-3xl">
          Files sent in and uploaded through this screen. These are the real thing.
        </p>
        {uploads.length > 0 ? (
          <ul>{uploads.map((m) => <Row key={m.id} row={m} />)}</ul>
        ) : (
          <p className="text-sm text-gray-500 py-4">Nothing uploaded yet.</p>
        )}
      </section>
    </div>
  );
}
