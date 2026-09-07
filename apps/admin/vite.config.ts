import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // env lives at the monorepo root, not in the app folder
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5174,
    strictPort: true,
    // reachable through the cloudflared tunnel host
    allowedHosts: true,
    hmr: { clientPort: 443, protocol: 'wss' },
  },
  build: { sourcemap: true, target: 'es2022' },
});
