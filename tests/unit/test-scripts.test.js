// tests/unit/test-scripts.test.js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * C-D20: `npm test` was `vitest run`, which runs tests/unit/** AND tests/db/**
 * under one command. The nine DB files need a live MySQL and an untracked
 * .env.local (vitest.config.mjs:4-6), and tests/db/schema.test.js shells out to
 * db-setup-v2.mjs against it. On a clean checkout they fail in `beforeAll`, and
 * a newcomer cannot tell a real failure from a missing database.
 *
 * A drift guard, not a formality: the split is only worth anything if CI uses
 * it, and a workflow that quietly goes back to `npm test` puts the two failure
 * modes back in one log again.
 */
const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(
  path.join(root, '.github', 'workflows', 'production-release.yml'), 'utf8'
);

describe('npm test scripts', () => {
  it('has a unit-only script that names tests/unit and nothing else', () => {
    expect(pkg.scripts['test:unit']).toBeTruthy();
    expect(pkg.scripts['test:unit']).toContain('tests/unit');
    expect(pkg.scripts['test:unit']).not.toContain('tests/db');
  });

  it('has a database-only script that names tests/db and nothing else', () => {
    expect(pkg.scripts['test:db']).toBeTruthy();
    expect(pkg.scripts['test:db']).toContain('tests/db');
    expect(pkg.scripts['test:db']).not.toContain('tests/unit');
  });

  it('keeps `npm test` running both', () => {
    const test = pkg.scripts.test;
    expect(test).toBeTruthy();
    // Either the bare runner (vitest.config.mjs includes both trees) or an
    // explicit chain of the two scripts. Not one of them alone.
    const bothViaConfig = /^vitest run$/.test(test.trim());
    const bothViaChain = test.includes('test:unit') && test.includes('test:db');
    expect(bothViaConfig || bothViaChain, `test script is "${test}"`).toBe(true);
  });

  it('still points the vitest config at both trees, so `npm test` is honest', () => {
    const config = fs.readFileSync(path.join(root, 'vitest.config.mjs'), 'utf8');
    expect(config).toContain('tests/unit/');
    expect(config).toContain('tests/db/');
  });
});

describe('the release workflow uses the split', () => {
  it('runs the unit suite and the database suite as separate steps', () => {
    expect(workflow).toContain('npm run test:unit');
    expect(workflow).toContain('npm run test:db');
  });

  it('no longer runs the two under one bare `npm test` step', () => {
    // A single step means one red X covering both "the code is broken" and
    // "the database service did not come up".
    const steps = workflow.split('\n').map((l) => l.trim());
    expect(steps).not.toContain('- run: npm test');
  });
});
