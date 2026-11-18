import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
    exclude: ['dist/**', 'node_modules/**'],
    server: {
      // Vite's dependency transform doesn't yet recognize `node:sqlite` as a
      // builtin (it's very new/experimental) and tries to bundle it as if it
      // were an npm package named "sqlite" — forcing it external makes
      // Vitest hand the import straight to Node instead.
      deps: {
        external: [/^node:sqlite$/],
      },
    },
  },
});
