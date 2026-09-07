import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // env lives at the monorepo root, not in the app folder
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    // ngrok / tunnel host — Vite blocks unknown hosts by default
    allowedHosts: true,
    // one tunnel: the mini-app proxies API calls to the local NestJS server
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      // MinIO is on localhost — a phone opening the app through the tunnel
      // cannot reach it, so object storage rides the same origin.
      '/media': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/media/, ''),
      },
    },
    // HMR over the https tunnel
    hmr: { clientPort: 443, protocol: 'wss' },
  },
  build: { sourcemap: true, target: 'es2022' },
});
