import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Set by the deploy-docs workflow from actions/configure-pages' `base_path` output,
  // so this never has to hardcode (or guess) the repo name.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      // Point at source so token/component changes are live without rebuilding the package
      '@tinkermonkey/heimdall-ui/css': path.resolve(__dirname, '../src/tokens/tokens.css'),
      '@tinkermonkey/heimdall-ui': path.resolve(__dirname, '../src/index.ts'),
    },
  },
})
