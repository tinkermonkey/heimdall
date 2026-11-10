#!/usr/bin/env node
// Fails when package.json points consumers at a file the published tarball doesn't contain.
//
// Checks every path in `exports` (all conditions, all subpaths) plus `main`, `module` and `types`
// against the file list `npm pack` would publish. Run after `npm run build`: dist/ must exist.
// Also checks that the tarball holds only dist/ and agent-skills/ (no source, tests or CJS build),
// that declarations don't import unpublished source, that the JS entry leaves its dependencies
// external, and that every font the fonts stylesheet names ships (tinkermonkey/heimdall#343).
//
// Why: 0.9.0 and 0.9.1 shipped with "./css" -> ./dist/style.css while the build emitted
// dist/heimdall-ui.css (tinkermonkey/heimdall#303). The docs app, test app and tests all alias the
// specifier to source, so only a real consumer of the tarball could see it.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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
for (const target of new Set(targets.map((t) => t.target))) {
  const rel = target.replace(/^\.\//, '')
  if (!/\.[cm]?js$/.test(rel) || !files.has(rel)) continue
  const code = readFileSync(path.join(root, rel), 'utf8')
  for (const [name, signatures] of Object.entries(BUNDLED_SIGNATURES)) {
    const sig = signatures.find((re) => re.test(code))
    if (sig) problems.push(`${rel}: contains a bundled copy of ${name} (matched ${sig}); keep it external`)
  }
  // Every bare import left in the bundle must be something npm installs for the consumer.
  const specifiers = [
    ...code.matchAll(/^\s*(?:import|export)\b[^'";]*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm),
  ]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .filter((spec) => !spec.startsWith('.') && !spec.startsWith('/'))
  for (const spec of new Set(specifiers)) {
    if (!declared.has(packageOf(spec))) {
      problems.push(`${rel}: imports ${spec}, which is not in dependencies or peerDependencies`)
    }
  }
}

// Every font the fonts stylesheet names must ship. Root-relative URLs (`/fonts/...`) resolve
// against dist/, where the build copies the Vite public directory.
const fontsTarget = pkg.exports?.['./fonts']
const fontsCss = typeof fontsTarget === 'string' ? fontsTarget : fontsTarget?.default
if (typeof fontsCss === 'string' && files.has(fontsCss.replace(/^\.\//, ''))) {
  const rel = fontsCss.replace(/^\.\//, '')
  const css = readFileSync(path.join(root, rel), 'utf8')
  for (const [, url] of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    if (/^(data:|https?:)/.test(url)) continue
    const resolved = url.startsWith('/') ? path.posix.join('dist', url) : path.posix.join(path.posix.dirname(rel), url)
    if (!files.has(resolved)) problems.push(`exports > ./fonts: ${rel} references ${url}, but ${resolved} is not published`)
  }
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
