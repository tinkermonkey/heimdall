/* eslint-disable no-undef */
import { defineConfig, transformWithEsbuild } from 'vite'
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

// Per-module build (0.13.0): each source module is its own file under dist/, and each emitted JS
// module imports the stylesheets of the CSS files its source imported. A consumer's bundler then
// drops the modules (and the stylesheets) of components the app never imports, which a single
// dist/index.js prevented. Vite's library mode extracts CSS without importing it and leaves an
// `/* empty css */` comment where each CSS import was, so this plugin puts the import back in that
// spot, keeping the source's evaluation order. It then writes dist/style.css (the "./css" export,
// every stylesheet in one file) by walking the emitted imports in ESM evaluation order, which is
// the order the per-module imports apply the CSS in.
const EMPTY_CSS_PLACEHOLDER = /^\/\* empty css\s*\*\/$/gm
const IMPORT_SPECIFIER = /^\s*(?:import|export)\s*(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/gm
const injectCssImports = {
  name: 'heimdall-inject-css-imports',
  apply: 'build',
  enforce: 'post',
  async generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter((file) => file.type === 'chunk')
    for (const chunk of chunks) {
      const css = [...(chunk.viteMetadata?.importedCss ?? [])]
      if (css.length === 0) continue
      const dir = path.posix.dirname(chunk.fileName)
      const statements = css.map((file) => {
        const rel = path.posix.relative(dir, file)
        return `import '${rel.startsWith('.') ? rel : `./${rel}`}';`
      })
      const placeholders = chunk.code.match(EMPTY_CSS_PLACEHOLDER) ?? []
      if (placeholders.length !== statements.length) {
        this.error(
          `${chunk.fileName}: ${statements.length} stylesheet(s) but ${placeholders.length} "empty css" placeholder(s); ` +
            'cannot place the CSS imports in source order'
        )
      }
      let next = 0
      chunk.code = chunk.code.replace(EMPTY_CSS_PLACEHOLDER, () => statements[next++])
    }

    const ordered = []
    const seen = new Set()
    const visit = (fileName) => {
      if (seen.has(fileName)) return
      seen.add(fileName)
      const file = bundle[fileName]
      if (!file) return
      if (file.type === 'asset') {
        if (fileName.endsWith('.css')) ordered.push(String(file.source))
        return
      }
      const dir = path.posix.dirname(fileName)
      for (const [, spec] of file.code.matchAll(IMPORT_SPECIFIER)) {
        if (spec.startsWith('.')) visit(path.posix.normalize(path.posix.join(dir, spec)))
      }
    }
    for (const chunk of chunks) if (chunk.isEntry) visit(chunk.fileName)
    // Minify the joined sheet as one file, as the single-file build did: that drops the rules two
    // stylesheets both define (Select and FilterDropdown share the dropdown panel rules).
    const { code: sheet } = await transformWithEsbuild(ordered.join('\n'), 'style.css', { loader: 'css', minify: true })
    this.emitFile({ type: 'asset', fileName: 'style.css', source: sheet })
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
    injectCssImports,
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
    },
    // One stylesheet per source module, imported by that module's JS (see injectCssImports, which
    // also writes the combined dist/style.css that the "./css" export names).
    cssCodeSplit: true,
    rollupOptions: {
      // React is a peer dependency; everything in `dependencies` is installed next to the package,
      // so leave it to the consumer's bundler, which dedupes it with the app's own copies
      // (tinkermonkey/heimdall#343). Subpath imports (`react/jsx-runtime`, `react-dom/client`,
      // `react-markdown/...`) are external too. `npm run check:package` fails if any of them ends up
      // bundled.
      external: (id) => EXTERNAL_PACKAGES.some((name) => id === name || id.startsWith(`${name}/`)),
      output: {
        // dist/ mirrors src/: dist/index.js, dist/components/Panel.js, dist/components/Panel.css, …
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
})
