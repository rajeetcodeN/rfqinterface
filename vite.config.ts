import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/python': {
          target: 'https://apirfq.onrender.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/python/, '')
        },
        '/api/cost': {
          target: 'https://cost-calapi.onrender.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cost/, '')
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
