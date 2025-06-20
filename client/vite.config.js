import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5555', // Your Flask dev server
        changeOrigin: true,
        secure: false,
        // You can keep the rewrite if Flask expects '/api' removed
        // rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
}));
