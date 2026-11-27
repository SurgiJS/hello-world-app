import { defineConfig } from 'vitest/config';
import surgi from '@surgijs/compiler/vite';

export default defineConfig({
  base: './',
  plugins: [surgi()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
