import { assertCan } from '../../../../lib/auth/assert-can';
import { listMedia, mediaAlt } from '../../../../lib/media/repo';
import {
  replaceMediaAction, setGalleryVisibilityAction, updateMediaAltAction,
  addMediaAction, setFocalPointAction, deleteMediaAction,
} from './actions';
import { LOCALES, LOCALE_LABELS, LOCALE_HTML_LANG } from '../../../../lib/i18n/locales';
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
  // Replacing a picture now KEEPS its description (lib/media/replace.js).
  // Swapping the file is not the same act as discarding the sentence that
  // describes it, and the reset used to happen silently — a screen-reader user
  // heard nothing where they used to hear something, with no sign of it here.
  // Clearing all three boxes below is the deliberate way to empty it.
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
        {described ? null : (
          <p className="text-sm text-amber-900">
            <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold">
              No description
            </span>{' '}
            Nobody using a screen reader is told what this picture shows.
          </p>
        )}

        {/* One submit writes all three languages. An empty box DROPS that
            language rather than storing an empty string: mediaAlt() falls back
            to English for a missing key, and a stored '' would satisfy the
            lookup and defeat the fallback — a Bangla reader would get silence
            where they should have got the English sentence. */}
        <form action={updateMediaAltAction} className="space-y-2 pt-1">
          <input type="hidden" name="id" value={row.id} />
          <p className="text-xs text-gray-500">
            Describe what is in the frame, not the file. A reader who cannot see it
            should learn what they are missing.
          </p>
          {LOCALES.map((locale) => (
            <label key={locale} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {LOCALE_LABELS[locale]}
              </span>
              <input
                type="text"
                name={`alt_${locale}`}
                defaultValue={row.alt?.[locale] ?? ''}
                maxLength={300}
                lang={LOCALE_HTML_LANG[locale]}
                placeholder={locale === 'en' ? 'Traffic on the open carriageway at Vogra' : ''}
                className="w-full rounded border px-2 py-1 text-sm"
              />
            </label>
          ))}
          <button type="submit" className="px-3 py-1.5 rounded border text-sm">
            Save description
          </button>
        </form>
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

        {/* Where the subject is, as a fraction of the width and height. A hero
            cropped to a wide band keeps this point in frame (SiteImage sets
            object-position from it). 0.5 / 0.5 is the centre. Keyed on the
            saved values so the inputs show what was stored after a save. */}
        <form
          key={`${row.id}:${row.focal_x}:${row.focal_y}`}
          action={setFocalPointAction} className="flex flex-wrap items-center gap-2 sm:justify-end"
        >
          <input type="hidden" name="id" value={row.id} />
          <label className="text-xs text-gray-600">Focus x
            <input type="number" name="focal_x" min="0" max="1" step="0.05" defaultValue={Number(row.focal_x ?? 0.5)} className="ml-1 w-16 rounded border px-1 py-0.5 text-sm" />
          </label>
          <label className="text-xs text-gray-600">y
            <input type="number" name="focal_y" min="0" max="1" step="0.05" defaultValue={Number(row.focal_y ?? 0.5)} className="ml-1 w-16 rounded border px-1 py-0.5 text-sm" />
          </label>
          <button type="submit" className="px-3 py-1.5 rounded border text-sm">Set focus</button>
        </form>

        {/* Refused while any page or the gallery still shows it — the action
            names the pages — so this can never leave a broken picture live. */}
        <form action={deleteMediaAction} className="sm:self-end">
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="px-3 py-1.5 rounded border border-red-300 text-red-700 text-sm hover:bg-red-50">
            Remove from library
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

      {/* Into the library directly, described on the way in. Until this form,
          the only door was the "Upload new" button inside a block's image
          field, which put a picture in use before anyone could describe it. */}
      <form action={addMediaAction} className="rounded border bg-white p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-gray-700">Add a picture
          <input type="file" name="file" required accept="image/jpeg,image/png,image/webp" className="block mt-1 text-sm max-w-[260px]" />
        </label>
        <label className="text-xs font-semibold text-gray-700 grow min-w-[260px]">Description (English — what is in the frame)
          <input type="text" name="alt_en" maxLength={300} placeholder="Traffic on the open carriageway at Vogra" className="block mt-1 w-full rounded border px-2 py-1 text-sm font-normal" />
        </label>
        <button type="submit" className="px-3 py-1.5 rounded bg-black text-white text-sm">Add to library</button>
      </form>

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
