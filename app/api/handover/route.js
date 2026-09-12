/**
 * The release handover's target (scripts/handover.sh).
 *
 * LiteSpeed keeps the app's Node process detached and, on this host, nothing
 * an account can do replaces it reliably. What does work: the running
 * process loads a route's compiled module lazily on the FIRST request for
 * it, so handover.sh writes `process.exit(0)` into this route's compiled
 * file, requests it once, and restores the file. The old process dies,
 * LiteSpeed spawns the current build.
 *
 * That only works for a route the running process has not served yet, and
 * every public route is hit by crawlers within hours while every admin
 * route is answered by the middleware before its module loads. So this
 * route exists for the script alone: unlinked, nothing to see, 204.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}
