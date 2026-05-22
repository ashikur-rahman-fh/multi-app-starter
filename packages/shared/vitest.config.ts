import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '#ui': path.resolve(__dirname, './src/ui'),
      '#components': path.resolve(__dirname, './src/ui/components'),
      '#hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
