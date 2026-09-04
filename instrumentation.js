/**
 * Runs once when the server starts, before it accepts a request.
 *
 * The work is in lib/deploy/boot-check.js; this file only decides whether to
 * reach it. That split is not stylistic. Next compiles `instrumentation.js` for
 * BOTH the Node and the Edge runtime, because middleware triggers this hook
 * too — and the Edge bundle cannot resolve `node:fs` at all, so a build fails
 * with "UnhandledSchemeError: Reading from node:fs/promises is not handled by
 * plugins" if anything reachable from here touches a Node builtin.
 *
 * `process.env.NEXT_RUNTIME` is substituted with a literal in each bundle, so
 * an import nested inside this `if` is dead code on Edge and is dropped. An
 * early `return` guard is NOT reliably eliminated the same way — that is what
 * broke the build the first time this was written.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertBootEnvironment } = await import('./lib/deploy/boot-check.js');
    await assertBootEnvironment();
  }
}
