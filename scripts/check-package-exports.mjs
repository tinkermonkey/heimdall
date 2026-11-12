#!/usr/bin/env node
// Fails when package.json points consumers at a file the published tarball doesn't contain.
//
// Checks every path in `exports` (all conditions, all subpaths) plus `main`, `module` and `types`
// against the file list `npm pack` would publish. Run after `npm run build`: dist/ must exist.
// Also checks that the tarball holds only dist/ and agent-skills/ (no source, tests or CJS build),
// that declarations don't import unpublished source, that every JS module leaves its dependencies
// external, that relative imports between modules resolve, that no JS module imports CSS and plain
// Node can import the entry (SSR), that every stylesheet is reachable through an export and each
// component sheet defines the classes its component renders, that the fonts stylesheet names its
// fonts by relative URLs that resolve to published files (tinkermonkey/heimdall#343), and that each
// font's OFL licence ships (tinkermonkey/heimdall#383).
//
// Why: 0.9.0 and 0.9.1 shipped with "./css" -> ./dist/style.css while the build emitted
// dist/heimdall-ui.css (tinkermonkey/heimdall#303). The docs app, test app and tests all alias the
// specifier to source, so only a real consumer of the tarball could see it.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))

// List the files as they are now instead of re-running `prepare` (the build). npm 10 ignores the
// --ignore-scripts flag for `pack` and prints the build log to stdout ahead of the JSON, so also
// set the config through the environment and parse only the trailing JSON array.
const packOutput = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, npm_config_ignore_scripts: 'true' },
  maxBuffer: 64 * 1024 * 1024,
})
const jsonStart = packOutput.search(/^\[\s*$/m)
if (jsonStart === -1) {
  console.error('check-package-exports: no JSON in `npm pack --dry-run --json` output:')
  console.error(packOutput.slice(0, 2000))
  process.exit(1)
}
const [packInfo] = JSON.parse(packOutput.slice(jsonStart))
const files = new Map(packInfo.files.map((f) => [f.path, f.size]))

/** Every string target in an exports value, with the key path that leads to it. */
function collectTargets(value, where, out) {
  if (typeof value === 'string') out.push({ where, target: value })
  else if (Array.isArray(value)) value.forEach((v, i) => collectTargets(v, `${where}[${i}]`, out))
  else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) collectTargets(v, `${where} > ${key}`, out)
  }
  return out
}

const targets = collectTargets(pkg.exports ?? {}, 'exports', [])
for (const field of ['main', 'module', 'types', 'typings']) {
  if (typeof pkg[field] === 'string') targets.push({ where: field, target: pkg[field] })
}

const problems = []
for (const { where, target } of targets) {
  const rel = target.replace(/^\.\//, '')
  if (rel.includes('*')) {
    // Subpath pattern: at least one published file must match it.
    const re = new RegExp('^' + rel.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.+') + '$')
    if (![...files.keys()].some((f) => re.test(f))) problems.push(`${where}: no published file matches ${target}`)
  } else if (!files.has(rel)) {
    problems.push(`${where}: ${target} is not in the package`)
  } else if (files.get(rel) === 0) {
    problems.push(`${where}: ${target} is empty`)
  }
}

// Shared rules components rely on must be in the shipped stylesheet. 0.10.0 used Tailwind's
// `.sr-only`, which only the dev app's Tailwind build defined, so consumers saw hidden text
// (tinkermonkey/heimdall#340).
const REQUIRED_CSS_RULES = [
  { selector: '.heimdall-visually-hidden', pattern: /(^|[},\s])\.heimdall-visually-hidden\s*[{,]/ },
]
const cssTarget = pkg.exports?.['./css']
if (typeof cssTarget === 'string' && files.has(cssTarget.replace(/^\.\//, ''))) {
  const css = readFileSync(path.join(root, cssTarget), 'utf8')
  for (const { selector, pattern } of REQUIRED_CSS_RULES) {
    if (!pattern.test(css)) problems.push(`exports > ./css: ${cssTarget} has no ${selector} rule`)
  }
}

// Only the build output and the agent skills ship (tinkermonkey/heimdall#343). Source, the
// Playwright test pages, fixtures and unit tests used to ship and doubled the unpacked size.
const SHIPPED_ROOTS = ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'dist/', 'agent-skills/']
const UNSHIPPABLE = [
  { re: /(^|\/)test-pages\//, what: 'a test page' },
  { re: /(^|\/)__tests__\//, what: 'a unit test' },
  { re: /\.(test|spec)\.(d\.)?[cm]?[jt]sx?$/, what: 'a test' },
  { re: /(^|\/)fixtures?\//, what: 'a test fixture' },
  { re: /\.cjs$/, what: 'a CommonJS build (the package is ESM-only)' },
  // public/fonts/ is copied to dist/fonts/ wholesale; only the stylesheet, the fonts and their licences serve a consumer.
  { re: /^dist\/fonts\/(?!.*(\.(css|woff2)|\/OFL\.txt)$)/, what: 'neither the fonts stylesheet, a font file nor a font licence' },
]
for (const file of files.keys()) {
  if (!SHIPPED_ROOTS.some((r) => (r.endsWith('/') ? file.startsWith(r) : file === r))) {
    problems.push(`files: ${file} is published, but only dist/ and agent-skills/ should be`)
    continue
  }
  const hit = UNSHIPPABLE.find(({ re }) => re.test(file))
  if (hit) problems.push(`files: ${file} is ${hit.what} and should not be published`)
}

// Declarations must not import source that doesn't ship.
for (const file of files.keys()) {
  if (!file.endsWith('.d.ts')) continue
  const dts = readFileSync(path.join(root, file), 'utf8')
  const bad = dts.match(/(?:from\s+|import\(\s*)['"]([^'"]*(?:\/src\/|test-pages|__tests__)[^'"]*)['"]/)
  if (bad) problems.push(`types: ${file} imports ${bad[1]}, which is not published`)
}

// Runtime dependencies and peers stay external: the consumer's bundler resolves them from the
// installed copies and dedupes them with the app's own, where a bundled copy ships the code twice
// (tinkermonkey/heimdall#343). Each signature is something the package's own code keeps through
// minification and heimdall's code doesn't contain.
const BUNDLED_SIGNATURES = {
  'd3-delaunay': [/_hullHash/, /\bhalfedges\b/],
  'd3-hierarchy': [/this\.depth\s*=\s*this\.height\s*=\s*0/, /[{,]\s*eachBefore\s*[:(]/],
  'react-markdown': [/remarkjs\/react-markdown/],
  'remark-gfm / micromark / mdast': [/gfmTable/, /\bmicromark/, /mdast-util/],
  'unified / vfile': [/Expected usable value/, /\bVFile\b/],
  react: [/__SECRET_INTERNALS|__CLIENT_INTERNALS/, /Symbol\.for\(\s*['"]react\.element['"]\s*\)/],
}
const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})])
const packageOf = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])
// Since 0.13.0 dist/ holds one module per source file (so consumers' bundlers can tree-shake it).
// Check every published module, not just the entry.
const IMPORT_RE =
  /^\s*(?:import|export)\b[^'";]*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm
const jsModules = [...files.keys()].filter((f) => f.startsWith('dist/') && /\.[cm]?js$/.test(f))
for (const rel of jsModules) {
  const code = readFileSync(path.join(root, rel), 'utf8')
  for (const [name, signatures] of Object.entries(BUNDLED_SIGNATURES)) {
    const sig = signatures.find((re) => re.test(code))
    if (sig) problems.push(`${rel}: contains a bundled copy of ${name} (matched ${sig}); keep it external`)
  }
  const specifiers = new Set([...code.matchAll(IMPORT_RE)].map((m) => m[1] ?? m[2] ?? m[3]))
  for (const spec of specifiers) {
    if (/\.(css|scss|sass|less)([?#].*)?$/.test(spec)) {
      // Node can't import a stylesheet (ERR_UNKNOWN_FILE_EXTENSION), so a JS module that imports one
      // breaks SSR builds, Vitest and plain `import()` of the package. Stylesheets ship as sheets.
      problems.push(`${rel}: imports the stylesheet ${spec}; JS modules must not import CSS`)
    } else if (spec.startsWith('.')) {
      // Relative imports between modules must resolve to a published file.
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec))
      if (!files.has(target)) problems.push(`${rel}: imports ${spec}, but ${target} is not published`)
    } else if (spec.startsWith('/')) {
      problems.push(`${rel}: imports ${spec}, an absolute path`)
    } else if (!declared.has(packageOf(spec))) {
      // Every bare import must be something npm installs for the consumer.
      problems.push(`${rel}: imports ${spec}, which is not in dependencies or peerDependencies`)
    }
  }
}

// SSR smoke test: plain Node (no bundler, no CSS handling) must load the entry, as it could in
// 0.12. Astro and Next server builds, Vite's ssrLoadModule and Vitest all reach the package this way.
const entryFile = path.join(root, (typeof pkg.exports?.['.'] === 'object' ? pkg.exports['.'].import : pkg.main) ?? 'dist/index.js')
try {
  const out = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const m = await import(${JSON.stringify(pathToFileURL(entryFile).href)}); console.log(Object.keys(m).length)`,
    ],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  )
  if (!(Number(out.trim()) > 0)) problems.push(`node: import('${path.relative(root, entryFile)}') loaded no exports`)
} catch (error) {
  const detail = String(error.stderr || error.message).split('\n').find((line) => /Error|ERR_/.test(line)) ?? error.message
  problems.push(`node: import('${path.relative(root, entryFile)}') fails in plain Node: ${detail.trim()}`)
}

// Stylesheets: dist/style.css (everything), and the opt-in sheets under dist/css/ (base.css plus one
// per component module). Every published stylesheet must be one of those, reachable through an
// export, and every subpath export must resolve to a published file.
const exportTargets = []
for (const [key, value] of Object.entries(pkg.exports ?? {})) {
  for (const { target } of collectTargets(value, key, [])) exportTargets.push({ key, target: target.replace(/^\.\//, '') })
}
const reachable = (file) =>
  exportTargets.some(({ target }) => {
    if (!target.includes('*')) return target === file
    const [before, after] = target.split('*')
    return file.startsWith(before) && file.endsWith(after) && file.length > before.length + after.length
  })
const SHEETS_DIR = 'dist/css/'
const BASE_SHEET = `${SHEETS_DIR}base.css`
const sheets = [...files.keys()].filter((f) => f.startsWith(SHEETS_DIR) && f.endsWith('.css'))
for (const file of [...files.keys()].filter((f) => f.endsWith('.css'))) {
  // The fonts stylesheet and the legacy dist/heimdall-ui.css forwarder (0.9.x) are the exceptions.
  if (file === 'dist/heimdall-ui.css' || file.startsWith('dist/fonts/')) continue
  if (!reachable(file)) problems.push(`files: ${file} is published but no export reaches it`)
  else if (files.get(file) === 0) problems.push(`files: ${file} is empty`)
}
if (!files.has(BASE_SHEET)) problems.push(`files: ${BASE_SHEET} (tokens + utilities) is not in the package`)
// Each subpath export resolves: plain targets were checked above; resolve the pattern ones per
// sheet, as a consumer's `import '@tinkermonkey/heimdall-ui/css/Button'` would.
for (const sheet of sheets) {
  const name = sheet.slice(SHEETS_DIR.length, -'.css'.length)
  const hit = Object.entries(pkg.exports ?? {}).find(([key, value]) => {
    if (!key.includes('*') || typeof value !== 'string') return false
    const [before, after] = key.split('*')
    const spec = `./css/${name}`
    if (!spec.startsWith(before) || !spec.endsWith(after)) return false
    const star = spec.slice(before.length, spec.length - after.length)
    return value.replace('*', star).replace(/^\.\//, '') === sheet
  })
  if (!hit) problems.push(`exports: ${pkg.name}/css/${name} does not resolve to ${sheet}`)
}

// Each component sheet is complete for its component: every heimdall class a component module
// names (a BEM-style string literal the full sheet defines) is in its sheet or in base.css. A
// module that renders another module's classes without importing it (GraphEdgeShape uses
// GraphEdge.css) needs an EXTRA_SHEETS entry in vite.config.mjs.
// What it can't see: classes built at runtime (`chip--${tone}`, a prefix joined with a variable),
// one-word block names (`btn`, `chip`: plain words such as `table` and `panel` also appear in
// labels and roles), modules outside dist/components/ (hooks, utils), and whether the sheets
// cascade the same in any load order (scripts/check-sheet-order.mjs covers that).
const classesIn = (css) => new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]))
const fullCssFile = typeof cssTarget === 'string' ? cssTarget.replace(/^\.\//, '') : null
if (fullCssFile && files.has(fullCssFile) && files.has(BASE_SHEET)) {
  const fullClasses = classesIn(readFileSync(path.join(root, fullCssFile), 'utf8'))
  const baseClasses = classesIn(readFileSync(path.join(root, BASE_SHEET), 'utf8'))
  const covered = new Set(baseClasses)
  for (const sheet of sheets) for (const c of classesIn(readFileSync(path.join(root, sheet), 'utf8'))) covered.add(c)
  const uncovered = [...fullClasses].filter((c) => !covered.has(c))
  if (uncovered.length > 0) problems.push(`${SHEETS_DIR}: no sheet defines ${uncovered.slice(0, 8).join(', ')} (in ${fullCssFile})`)
  // Hyphenated blocks (`stat-tile`), elements (`chip__dot`) and modifiers (`btn--primary`).
  const CLASS_TOKEN =
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9-]*__[a-z0-9-]+(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9]*--[a-z0-9-]+$/
  for (const rel of jsModules.filter((f) => f.startsWith('dist/components/'))) {
    const code = readFileSync(path.join(root, rel), 'utf8')
    const tokens = new Set(
      [...code.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)]
        .flatMap((m) => m[2].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/))
        .filter((t) => CLASS_TOKEN.test(t) && fullClasses.has(t) && !baseClasses.has(t))
    )
    if (tokens.size === 0) continue
    const sheet = `${SHEETS_DIR}${path.posix.basename(rel, '.js')}.css`
    const own = files.has(sheet) ? classesIn(readFileSync(path.join(root, sheet), 'utf8')) : new Set()
    const missing = [...tokens].filter((t) => !own.has(t))
    if (missing.length > 0) {
      problems.push(`${rel}: renders ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ', …' : ''}, which ${files.has(sheet) ? sheet : 'no sheet'} doesn't define`)
    }
  }
}

// The fonts stylesheet must name its fonts by URLs relative to itself, and each must resolve to a
// published file. A consumer's bundler resolves relative URLs and emits the fonts; a root-absolute
// `/fonts/...` URL is left for the browser, so it only loads when the app serves /fonts/ itself
// (Vite warns it "didn't resolve at build time").
const fontsTarget = pkg.exports?.['./fonts']
const fontsCss = typeof fontsTarget === 'string' ? fontsTarget : fontsTarget?.default
if (typeof fontsCss === 'string' && files.has(fontsCss.replace(/^\.\//, ''))) {
  const rel = fontsCss.replace(/^\.\//, '')
  const css = readFileSync(path.join(root, rel), 'utf8')
  const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1].trim())
  if (urls.length === 0) problems.push(`exports > ./fonts: ${rel} names no font files`)
  for (const url of urls) {
    if (url.startsWith('data:')) continue
    if (!url.startsWith('./') && !url.startsWith('../')) {
      problems.push(`exports > ./fonts: ${rel} references ${url}; use a URL relative to the stylesheet (./...)`)
      continue
    }
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), url.replace(/[?#].*$/, '')))
    if (!files.has(resolved)) problems.push(`exports > ./fonts: ${rel} references ${url}, but ${resolved} is not published`)
  }
}

// The SIL Open Font License requires its text to accompany redistributed font files
// (tinkermonkey/heimdall#383).
const REQUIRED_FILES = ['dist/fonts/inter/OFL.txt', 'dist/fonts/jetbrains-mono/OFL.txt']
for (const file of REQUIRED_FILES) {
  if (!files.has(file)) problems.push(`files: ${file} is not in the package (font licence)`)
  else if (files.get(file) === 0) problems.push(`files: ${file} is empty (font licence)`)
}

if (problems.length > 0) {
  console.error(`check-package-exports: ${problems.length} problem(s) in ${packInfo.name}@${packInfo.version}:`)
  for (const p of problems) console.error(`  - ${p}`)
  if (![...files.keys()].some((f) => f.startsWith('dist/'))) {
    console.error('  (dist/ is missing from the package: run `npm run build` first.)')
  }
  process.exit(1)
}

console.log(
  `check-package-exports: ${targets.length} package.json targets found among ${files.size} published files of ${packInfo.name}@${packInfo.version}`
)
