import { redirectOrNotFound } from '../../lib/redirects/resolve.js';

/**
 * The last route Next tries.
 *
 * Next matches static segments first, then dynamic ones, then catch-alls — so
 * this runs only when nothing else did: `/project` still reaches the legacy
 * page, `/en/travel/toll` still reaches the localised one, and this sees only
 * requests that were about to 404.
 *
 * In practice it sees very little: `app/[locale]/` is a dynamic segment, so it
 * wins over this catch-all for any single-segment URL, and `[locale]/[...slug]`
 * wins for anything deeper. Those two routes call the same helper, so a redirect
 * resolves wherever the request lands. This remains for the paths that genuinely
 * reach it — a request with an empty first segment, or a future tree that does
 * not shadow it.
 *
 * The alternative home for all of this is middleware, and the readiness review's
 * own warning rules it out: it runs on every request including static assets, on
 * a memory-limited host, and a per-request database read there is the change most
 * likely to take the site down under load. `middleware.js` is also on the
 * do-not-modify list and runs on the edge runtime, where mysql2 cannot load.
 */
export const dynamic = 'force-dynamic';

export default async function Unmatched({ params }) {
  const { unmatched } = await params;
  await redirectOrNotFound(`/${(unmatched || []).join('/')}`);
}
