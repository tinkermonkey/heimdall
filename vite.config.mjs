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

// Per-module build (0.13.0): each source module is its own file under dist/, so a consumer's bundler
// drops the modules of components the app never imports. The JS imports no CSS (0.12's didn't
// either), so Node, SSR builds and test runners load the package as plain ESM. Stylesheets ship as:
//   dist/style.css       every stylesheet in one file (the "./css" export, as in 0.12)
//   dist/css/base.css    tokens + shared utilities (the "./css/base" export)
//   dist/css/<Name>.css  one per component module: its own CSS plus that of every component and
//                        helper it imports, minus base (the "./css/<Name>" exports)
// Vite's library mode extracts each module's CSS and leaves an `/* empty css */` comment where the
// import was. This plugin reads those spots to learn where each stylesheet sits in ESM evaluation
// order, deletes the comments, and writes the sheets above in that order (0.12's rule order).
const EMPTY_CSS_PLACEHOLDER = /^\/\* empty css\s*\*\/$/gm
const IMPORT_SPECIFIER = /^\s*(?:import|export)\s*(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/gm
const CSS_MARK = 'heimdall-css:'
// The stylesheets that make up dist/css/base.css, as emitted under dist/.
const BASE_SHEETS = ['tokens/tokens.css', 'styles/utilities.css']
// Classes a module renders from another module's stylesheet without importing it. Importing it in
// source would move that stylesheet earlier in dist/style.css, so the component sheets add it here.
const EXTRA_SHEETS = {
  // graph-edge__* classes
  'components/GraphEdgeShape.js': ['components/GraphEdge.css'],
  // the inspector's layered-control__eyebrow title
  'components/AdjacencyMatrix.js': ['components/LayeredGraphControls.css'],
  // trace-detail__* classes (TraceViewer renders it; not exported on its own)
  'components/TraceDetailPanel.js': ['components/TraceViewer.css'],
}
let resolvedCssTarget
const cssSheets = {
  name: 'heimdall-css-sheets',
  apply: 'build',
  enforce: 'post',
  configResolved(config) {
    resolvedCssTarget = config.build.cssTarget || config.build.target
  },
  async generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter((file) => file.type === 'chunk')
    // Each chunk's imports (JS modules and stylesheets), in source order.
    const imports = new Map()
    for (const chunk of chunks) {
      const css = [...(chunk.viteMetadata?.importedCss ?? [])]
      const placeholders = chunk.code.match(EMPTY_CSS_PLACEHOLDER) ?? []
      if (placeholders.length !== css.length) {
        this.error(
          `${chunk.fileName}: ${css.length} stylesheet(s) but ${placeholders.length} "empty css" placeholder(s); ` +
            'cannot tell where the stylesheets sit in evaluation order'
        )
      }
      const dir = path.posix.dirname(chunk.fileName)
      let next = 0
      const marked = chunk.code.replace(EMPTY_CSS_PLACEHOLDER, () => `import '${CSS_MARK}${css[next++]}';`)
      const deps = []
      for (const [, spec] of marked.matchAll(IMPORT_SPECIFIER)) {
        if (spec.startsWith(CSS_MARK)) deps.push(spec.slice(CSS_MARK.length))
        else if (spec.startsWith('.')) deps.push(path.posix.normalize(path.posix.join(dir, spec)))
      }
      imports.set(chunk.fileName, deps)
      chunk.code = chunk.code.replace(/^\/\* empty css\s*\*\/\n?/gm, '')
    }

    // Stylesheets reachable from a module, in ESM evaluation order (depth first, imports in order).
    const sheetsFrom = (fileName, extra = {}) => {
      const out = []
      const seen = new Set()
      const visit = (name) => {
        if (seen.has(name)) return
        seen.add(name)
        if (name.endsWith('.css')) out.push(name)
        else for (const dep of [...(imports.get(name) ?? []), ...(extra[name] ?? [])]) visit(dep)
      }
      visit(fileName)
      return out
    }
    // Minify each sheet as one file, as the single-file build did: that drops rules two stylesheets
    // both define (Select, FilterDropdown, EntityPicker and RowMenu each inline dropdown-base.css).
    // Same browser target as Vite's own CSS minification, so no newer syntax (`inset`) creeps in.
    const emitSheet = async (fileName, names) => {
      const joined = names.map((name) => String(bundle[name].source)).join('\n')
      const { code } = await transformWithEsbuild(joined, path.posix.basename(fileName), {
        loader: 'css',
        minify: true,
        charset: 'utf8',
        target: resolvedCssTarget,
      })
      this.emitFile({ type: 'asset', fileName, source: code })
    }

    const entry = chunks.find((chunk) => chunk.isEntry)
    const all = sheetsFrom(entry.fileName)
    const rank = new Map(all.map((name, i) => [name, i]))
    const unreached = Object.values(bundle)
      .filter((file) => file.type === 'asset' && file.fileName.endsWith('.css') && !rank.has(file.fileName))
      .map((file) => file.fileName)
      .filter((name) => name !== 'heimdall-ui.css')
    if (unreached.length > 0) this.error(`stylesheets that ${entry.fileName} doesn't reach: ${unreached.join(', ')}`)
    for (const name of BASE_SHEETS) {
      if (!rank.has(name)) this.error(`base stylesheet ${name} is not imported by ${entry.fileName}`)
    }
    for (const [module, sheets] of Object.entries(EXTRA_SHEETS)) {
      if (!imports.has(module)) this.error(`EXTRA_SHEETS: no module ${module}`)
      for (const name of sheets) if (!rank.has(name)) this.error(`EXTRA_SHEETS: no stylesheet ${name}`)
    }

    await emitSheet('style.css', all)
    await emitSheet('css/base.css', all.filter((name) => BASE_SHEETS.includes(name)))
    for (const chunk of chunks) {
      if (!chunk.fileName.startsWith('components/')) continue
      // Sorted into dist/style.css's order, so a sheet's rules cascade as they do there.
      const own = sheetsFrom(chunk.fileName, EXTRA_SHEETS)
        .filter((name) => !BASE_SHEETS.includes(name))
        .sort((a, b) => rank.get(a) - rank.get(b))
      if (own.length > 0) await emitSheet(`css/${path.posix.basename(chunk.fileName, '.js')}.css`, own)
    }
    // Each per-file stylesheet is inside the sheets above; don't publish it on its own as well.
    for (const name of all) delete bundle[name]
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
    cssSheets,
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
    // One stylesheet per source module, which cssSheets combines into dist/style.css, dist/css/base.css
    // and the per-component dist/css/<Name>.css.
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
