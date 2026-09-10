import { defineConfig } from 'vitest/config';

/**
 * Standalone config for the security / anti-test suite.
 * Run from apps/api:  node_modules/.bin/vitest run --config security-tests/vitest.config.ts
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: __dirname,
    include: ['static/**/*.spec.ts', 'e2e/**/*.spec.ts'],
  },
});
