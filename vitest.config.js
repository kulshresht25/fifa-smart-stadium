import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom to simulate browser APIs in tests
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.test.js', 'tests/integration/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['utils/**/*.js', 'src/**/*.js'],
      exclude: ['utils/i18n.js'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
});
