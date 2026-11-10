/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = process.env.VITE_PROJECT_DIR || path.dirname(fileURLToPath(import.meta.url))

const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'))

// 0.9.0 and 0.9.1 emitted the stylesheet as dist/heimdall-ui.css (Vite 6 names it after the
// package), which broke the published "./css" export. Consumers who worked around that by
// pointing at the file directly keep working through this one-line forwarder.
const legacyCssForwarder = {
  name: 'heimdall-legacy-css-forwarder',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'heimdall-ui.css',
      source: '/* Deprecated: import "@tinkermonkey/heimdall-ui/css" (dist/style.css) instead. */\n@import "./style.css";\n',
    })
  },
}

// Bare-specifier packages the library build leaves as imports: peer dependencies plus every
// runtime dependency.
const EXTERNAL_PACKAGES = [...Object.keys(pkg.peerDependencies ?? {}), ...Object.keys(pkg.dependencies ?? {})]

export default defineConfig({
  // The dev app's shell shows the package version (see src/App.tsx).
  define: { __HEIMDALL_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    dts({
      include: 'src',
      // Declarations for the public API only: not the dev app's entry points, the Playwright test
      // pages or the unit tests (tinkermonkey/heimdall#343).
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', 'src/test-pages/**', 'src/App.tsx', 'src/main.tsx'],
    }),
    legacyCssForwarder,
  ],
  cacheDir: process.env.CI ? '/tmp/.vite' : undefined,
  // Vitest unit tests are the *.test.ts files under src/. Without this, Vitest's
  // default include also picks up the Playwright specs in tests/*.spec.ts.
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tinkermonkey/heimdall-ui/css': path.resolve(__dirname, './src/tokens/tokens.css'),
      '@tinkermonkey/heimdall-ui': path.resolve(__dirname, './src/index.ts'),
    },
  },
  // Only scan the dev app's own entry. By default Vite crawls every .html file
  // in the repo (docs/, test-app/, design-reference/), and docs/ has its own
  // node_modules — so a bare `react` import could resolve to docs' copy and
  // bundle two Reacts, which crashes hooks ("Invalid hook call").
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      // ESM only: the package is "type": "module" and `exports` has no `require` condition, so a
      // CJS build was unreachable (tinkermonkey/heimdall#343).
      formats: ['es'],
      fileName: () => 'index.js',
      // Keep the stylesheet at dist/style.css, the path package.json's "./css" export names.
      // Vite 6 otherwise names it after the package (dist/heimdall-ui.css).
      cssFileName: 'style',
    },
    rollupOptions: {
      // React is a peer dependency; everything in `dependencies` is installed next to the package,
      // so leave it to the consumer's bundler, which dedupes it with the app's own copies
      // (tinkermonkey/heimdall#343). Subpath imports (`react/jsx-runtime`, `react-dom/client`,
      // `react-markdown/...`) are external too. `npm run check:package` fails if any of them ends up
      // bundled.
      external: (id) => EXTERNAL_PACKAGES.some((name) => id === name || id.startsWith(`${name}/`)),
    },
  },
})
