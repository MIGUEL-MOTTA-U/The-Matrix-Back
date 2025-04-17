import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      exclude: ['node_modules', 'dist', 'src/plugins/**', 'src/routes/**', 'src/server.ts', 'src/workers/**'],
    },
    testTimeout: 20000,
  },
});
  