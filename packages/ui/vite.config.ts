import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ALIASES, DST } from './vite.config.constants';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'es2020',
    outDir: DST,
    emptyOutDir: true,
    minify: true,
    cssCodeSplit: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      output: {
        assetFileNames: 'style.css',
        manualChunks: undefined,
        entryFileNames: 'main.js',
        chunkFileNames: 'main.js',
      },
    },
  },
  resolve: {
    alias: ALIASES,
  },
  server: {
    port: 8080,
  },
});
