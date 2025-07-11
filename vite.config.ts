import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@entities': path.resolve(__dirname, 'src/entities/index.ts'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@src': path.resolve(__dirname, 'src'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@types': path.resolve(__dirname, 'src/types/index.ts'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // No additionalData to avoid conflicts with @use rules
      },
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  assetsInclude: ['**/*.svg'],
});
