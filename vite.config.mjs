import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), dts({ include: 'src' })],
  cacheDir: process.env.CI ? '/tmp/.vite' : undefined,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tinkermonkey/heimdall-ui/css': path.resolve(__dirname, './src/tokens/tokens.css'),
      '@tinkermonkey/heimdall-ui': path.resolve(__dirname, './src/index.ts'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'HeimdallUI',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
