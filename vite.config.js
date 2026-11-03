import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: Object.fromEntries(['/api', '/static', '/exercise_videos'].map(path => [path, {
      target: 'http://127.0.0.1:5002',
      changeOrigin: true,
      timeout: 0,
      proxyTimeout: 0,
    }])),
  },
  build: {
    outDir: 'dist', emptyOutDir: true,
    rollupOptions: { output: { manualChunks: { charts: ['chart.js/auto'], icons: ['lucide'], react: ['react', 'react-dom/client'] } } },
  },
});
