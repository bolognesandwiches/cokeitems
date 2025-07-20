import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://decibel.fun',
        changeOrigin: true,
        rewrite: (path) => {
          // Extract the endpoint from the query parameter
          const url = new URL(path, 'http://localhost');
          const endpoint = url.searchParams.get('endpoint');
          return endpoint || '/';
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔧 Proxying request to:', proxyReq.path);
          });
          proxy.on('error', (err, req, res) => {
            console.log('⚠️ Proxy error:', err.message);
          });
        },
      },
      '/client2': {
        target: 'https://decibel.fun',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://decibel.fun',
        changeOrigin: true,
      },
    },
  },
}) 