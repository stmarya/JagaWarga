import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 72,
        statements: 70,
        functions: 75,
        branches: 64,
      },
    },
  },
});