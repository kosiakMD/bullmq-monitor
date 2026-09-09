import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ALIASES, DST } from './vite.config.constants';

/** Build used for the GitHub Pages demo (runs entirely on mocked data). */
export default defineConfig({
  base: '/bullmq-monitor/',
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'es2020',
    outDir: DST,
    emptyOutDir: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 100000,
  },
  resolve: {
    alias: ALIASES,
  },
});
