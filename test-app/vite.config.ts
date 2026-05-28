import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@tinkermonkey/heimdall-ui/css': path.resolve(__dirname, '../src/tokens/tokens.css'),
      '@tinkermonkey/heimdall-ui': path.resolve(__dirname, '../src/index.ts'),
    },
  },
})
