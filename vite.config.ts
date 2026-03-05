import { defineConfig } from 'vite'

// Set BASE to '/' for username.github.io root deployments.
// Change to '/your-repo-name/' for project page deployments, e.g. '/zac-intelligence/'
const BASE = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base: BASE,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
  },
})
