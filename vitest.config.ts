import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./apps/web/src/test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@tokiflow/db': path.resolve(__dirname, './packages/db'),
      '@tokiflow/shared': path.resolve(__dirname, './packages/shared'),
    },
  },
});
