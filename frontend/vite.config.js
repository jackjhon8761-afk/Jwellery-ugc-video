import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api and /uploads to the Express backend in dev so the frontend
// can use relative paths and never needs to know the backend's port/host.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
