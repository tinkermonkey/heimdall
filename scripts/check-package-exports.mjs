#!/usr/bin/env node
// Fails when package.json points consumers at a file the published tarball doesn't contain.
//
// Checks every path in `exports` (all conditions, all subpaths) plus `main`, `module` and `types`
// against the file list `npm pack` would publish. Run after `npm run build`: dist/ must exist.
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
