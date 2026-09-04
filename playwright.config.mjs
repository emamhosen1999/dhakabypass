import { defineConfig } from '@playwright/test';

/**
 * Two things are overridable from the environment, and both exist because the
 * defaults are right for a developer's machine and wrong everywhere else.
 *
 * PLAYWRIGHT_BASE_URL — the deployment readiness review (N7) records that this
 * file hardcoded localhost:3000 and started `npm run dev`, so it could never be
 * pointed at a real deployment. The post-deploy verification in the runbook
 * wants exactly that: run the suite against the staging host and see the pages
 * a visitor sees. When a base URL is given, the dev server is not started —
 * starting one would be pointless and would mask a failure to reach the target.
 *
 * PLAYWRIGHT_CHROMIUM — a browser binary to use instead of the one Playwright
 * downloads. Cloud sandboxes ship a pre-installed Chromium whose build number
 * rarely matches the version this package pins, and every test then fails with
 * "Executable doesn't exist" — which reads like a broken test suite rather than
 * a missing download. Pointing at the installed binary is the documented fix
 * and costs nothing when the variable is unset.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const external = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  // Against a real deployment there is nothing to start, and `reuseExistingServer`
  // would not help: Playwright would still wait for a local port that never opens.
  ...(external
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120000,
        },
      }),
});
