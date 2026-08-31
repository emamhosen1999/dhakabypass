import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
// DB-touching tests run against a throwaway database, never the dev one.
process.env.DB_NAME_TEST = process.env.DB_NAME_TEST || 'dhakabypass_test';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js', 'tests/db/**/*.test.js'],
    environment: 'node',
    globals: false,
    testTimeout: 15000,
  },
});
