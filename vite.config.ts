import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_MARKETPLACE_API_ORIGIN ?? 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
