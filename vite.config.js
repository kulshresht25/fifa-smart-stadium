import { defineConfig } from 'vite';

export default defineConfig({
  // Serve project root as the web root so index.html is at /
  root: '.',
  server: {
    port: 5173,
    open: true,
  },
  // Resolve bare imports from utils/ and components/ without a bundler step
  resolve: {
    alias: {
      '@utils': '/utils',
      '@components': '/components',
      '@src': '/src',
    },
  },
});
