import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      __APP_MODE__: JSON.stringify(mode),
      __DEMO_MODE__: env.VITE_DEMO_MODE === 'true',
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: mode === 'development' 
        ? {
            '/api': {
              target: 'http://localhost:3001',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
              secure: false,
              ws: true,
              configure: (proxy, _options) => {
                proxy.on('error', (err) => {
                  console.log('proxy error', err);
                });
                proxy.on('proxyReq', (_proxyReq, req) => {
                  console.log('Sending Request:', req.method, req.url);
                });
                proxy.on('proxyRes', (proxyRes, req) => {
                  console.log('Received Response:', proxyRes.statusCode, req.url);
                });
              },
            },
          }
        : undefined,
    },
  };
});
