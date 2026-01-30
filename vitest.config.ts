import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'cfo-frontend/**', 'node_modules/**', 'src/tests/**'],
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/scoring/**/*.ts',
        'src/gates/**/*.ts',
        'src/maturity/**/*.ts',
        'src/risks/**/*.ts',
        'src/results/**/*.ts',
        'src/reports/**/*.ts',
        'src/actions/**/*.ts',
        'src/specs/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/__tests__/**',
        'src/tests/**',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        perFile: false,
      },
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
