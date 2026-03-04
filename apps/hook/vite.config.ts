import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import pkg from '../../package.json';
import { devMockApi } from './dev-mock-api';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss(), devMockApi(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@plannotator/ui': path.resolve(__dirname, '../../packages/ui'),
      '@plannotator/editor/styles': path.resolve(__dirname, '../../packages/editor/index.css'),
      '@plannotator/editor': path.resolve(__dirname, '../../packages/editor/App.tsx'),
    },
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
