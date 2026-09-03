/**
 * Standing explanation at the top of the media library.
 *
 * It is here because "placeholder" on 28 rows invites exactly one question, and
 * an operator should not have to ask anyone to get the answer. The two facts
 * that matter — these are DBEDC's own photographs, and they are too small — are
 * stated before the list rather than left to be inferred from the amber flags.
 */
export default function GuideNotice() {
  return (
    <section className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <h2 className="font-semibold text-base mb-1">Why these say “placeholder”</h2>
      <p className="mb-2">
        These are DBEDC’s own photographs, taken from the old website — but they are
        small copies made for slower connections. The largest is 1024 pixels wide and
        the home page banner is 686. They are stretched to fill a modern screen, which
        is why they look soft. Nothing is broken; they will look better the day the
        originals arrive.
      </p>
      <p className="mb-2">
        To replace one, choose a file on its row and press Replace. Every page using
        that picture updates at once — there is nothing else to edit.
      </p>
      <p>
        <strong>Please do not use pictures found through Google.</strong> Ten files from
        the old site were excluded because they belong to somebody else, and four of
        those are still live on the old site today — including two Google Maps
        screenshots and an aerial photograph of a motorway that is not this road.
      </p>
    </section>
  );
}
