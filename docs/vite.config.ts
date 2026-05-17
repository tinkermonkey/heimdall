import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
  },
  resolve: {
    alias: {
      // Point at source so token/component changes are live without rebuilding the package
      '@tinkermonkey/heimdall-ui/css': path.resolve(__dirname, '../packages/heimdall-ui/src/tokens/tokens.css'),
      '@tinkermonkey/heimdall-ui': path.resolve(__dirname, '../packages/heimdall-ui/src/index.ts'),
    },
  },
})
