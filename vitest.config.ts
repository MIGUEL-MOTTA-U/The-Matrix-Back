import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'lcov', 'html'],
      exclude: ['node_modules', 'dist', 'src/plugins/**', 'src/routes/**', 'src/server.ts', 'src/workers/**', 'docs/**', 'src/controllers/websockets/**', 'src/app/lobbies/services/**', 'src/app/game/services/**'],
      reportsDirectory: './coverage',
    },
    testTimeout: 20000,
  },
});
  