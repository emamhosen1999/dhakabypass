import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

/**
 * Lint gate (W6.7): Next's core-web-vitals rules, run in CI on every push.
 * Run with --max-warnings 0, so a warning fails CI as surely as an error.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  {
    ignores: [
      '.next/**', 'node_modules/**', 'var/**', 'old_dhakabypass/**', 'public/**',
      'deploy/**', 'coverage/**', 'playwright-report/**', 'test-results/**', '.playwright-mcp/**',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Every block type module is `export default { type, fields, Component }`
      // by design (lib/blocks/registry.js); naming 41 throwaway constants
      // would add nothing.
      'import/no-anonymous-default-export': 'off',
    },
  },
];
