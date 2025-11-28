// vitest.config.ts
// Vitest configuration for unit and integration testing

import { resolve } from 'path'

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'coverage', '**/*.d.ts', 'src/test/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/.next/**',
        // Infrastructure files tested via integration/E2E
        '**/lib/logging/sentry.ts',
        '**/lib/logging/alerts.ts',
        '**/lib/logging/supabase-writer.ts',
        '**/lib/logging/index.ts',
        '**/lib/security/abuse-logger.ts',
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ['verbose'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
