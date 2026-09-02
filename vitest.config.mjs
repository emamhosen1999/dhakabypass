import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
// DB-touching tests run against a throwaway database, never the dev one.
process.env.DB_NAME_TEST = process.env.DB_NAME_TEST || 'dhakabypass_test';

export default defineConfig({
  esbuild: {
    // This project has no tsconfig.json, jsconfig.json or @vitejs/plugin-react,
    // so esbuild defaults to the CLASSIC JSX runtime and emits bare
    // React.createElement(...) calls with nothing bringing React into scope —
    // every JSX test dies on "React is not defined". Next compiles the app's
    // JSX with the automatic runtime already; this makes the test transform
    // agree with it, rather than making every component import React purely to
    // satisfy the test runner.
    jsx: 'automatic',
  },
  test: {
    include: ['tests/unit/**/*.test.{js,jsx}', 'tests/db/**/*.test.js'],
    environment: 'node',
    globals: false,
    testTimeout: 15000,
    // The DB-backed tests in tests/db/** all share one throwaway database
    // (DB_NAME_TEST / dhakabypass_test). Running test files concurrently
    // creates windows where one file's in-flight INSERTs/DELETEs are visible
    // to another file's assertions (e.g. corridor-schema.test.js's
    // unique-constraint test briefly holding a toll_rates row that
    // corridor-tolls.test.js's admin-listing count could observe). The suite
    // is small and runs in seconds either way, so determinism is worth more
    // than the parallelism here.
    fileParallelism: false,
  },
});
