#!/usr/bin/env node
// Galaxy live-simulation drag benchmark (tinkermonkey/heimdall#287).
//
// Runs galaxySimulationStep headlessly the way GraphCanvas drives it in live mode (round bodies
// sized by galaxyBodyRadii, the dragged node passed as a pin), drags the heaviest satellite of the
// heaviest galaxy 150 px toward its parent over 3 frames, then releases it and lets the simulation
// settle. Prints the layout time of each drag frame and of the slowest tick after release, how many
// ticks it took for the pinned target to be final (1 = already final on the first tick after the
// drag), and checks the settled result: no overlapping bodies, the dropped node exactly at its pin.
//
// Usage:
//   node scripts/bench-galaxy-drag.mjs [--src path/to/galaxyLayout.ts] [--repeat 3] [fixture.json ...]
//
// --src benchmarks another copy of galaxyLayout.ts (e.g. one checked out from main) for a
// before/after comparison. Extra fixture paths use heimdall-layout-loop's format
// ({ nodes: [{ id, weight? }], edges: [{ sourceId, targetId }] }).
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const opt = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt)
const src = path.resolve(opt('--src', path.join(root, 'src/utils/galaxyLayout.ts')))
const repeat = Number(opt('--repeat', 3))
const extra = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))

const bundled = await build({ entryPoints: [src], bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'error', nodePaths: [path.join(root, 'node_modules')] })
const L = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)

// ---- fixtures ---------------------------------------------------------------------------------

/** { ids, parent: [child, parent][], weight?: Map } */
function tree(label, pairs, ids, weights) {
  return { label, ids, edges: pairs.map(([s, t]) => ({ source: s, target: t, structural: true })), weights }
}
function star(n, weighted) {
  const ids = ['hub', ...Array.from({ length: n }, (_, i) => `s${i}`)]
  const weights = weighted ? new Map(ids.slice(1).map((id, i) => [id, 1 + ((i * 37) % 1000)])) : undefined
  return tree(`star (${weighted ? `${n} weighted satellites` : `1 hub, ${n} leaves`})`, ids.slice(1).map(id => ['hub', id]), ids, weights)
}
function chain(n) {
  const ids = Array.from({ length: n }, (_, i) => `c${i}`)
  return tree('chain', ids.slice(1).map((id, i) => [ids[i], id]), ids)
}
function forest(trees) {
  const ids = []
  const pairs = []
  for (let t = 0; t < trees; t++) {
    const size = 3 + (t % 6)
    for (let j = 0; j < size; j++) {
      ids.push(`t${t}.${j}`)
      if (j > 0) pairs.push([`t${t}.${(j - 1) >> 1}`, `t${t}.${j}`])
    }
  }
  return tree(`forest of ${trees} small trees`, pairs, ids)
}
function fromFile(file, label) {
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  if (Array.isArray(raw.nodes[0])) {
    // compact form (src/utils/__tests__/fixtures): nodes [id, weight?][], edges [source, target][]
    return tree(label, raw.edges, raw.nodes.map(n => n[0]), new Map(raw.nodes.filter(n => n[1] !== undefined).map(n => [n[0], n[1]])))
  }
  const weights = new Map(raw.nodes.filter(n => Number.isFinite(n.weight)).map(n => [n.id, n.weight]))
  return tree(label, raw.edges.map(e => [e.sourceId, e.targetId]), raw.nodes.map(n => n.id), weights)
}

const fixtures = [
  fromFile(path.join(root, 'src/utils/__tests__/fixtures/flare.json'), 'flare'),
  star(400, false),
  chain(500),
  forest(149),
  forest(400),
  star(2000, true),
  chain(3000),
  ...extra.map(f => fromFile(f, path.basename(f, '.json'))),
]

// ---- harness ----------------------------------------------------------------------------------

/** GraphCanvas's sizing for round galaxy bodies (leaf-count sizes get the higher floor). */
function bodies(fx) {
  const childrenOf = new Map()
  for (const e of fx.edges) {
    if (!childrenOf.has(e.source)) childrenOf.set(e.source, [])
    childrenOf.get(e.source).push(e.target)
  }
  const weightOf = L.galaxyEffectiveWeights(fx.ids, childrenOf, id => fx.weights?.get(id))
  const radii = L.galaxyBodyRadii(weightOf, fx.weights?.size ? {} : { minRadius: L.GALAXY_UNWEIGHTED_MIN_RADIUS })
  const nodes = fx.ids.map(id => {
    const r = radii.get(id)
    return { id, width: 2 * r, height: 2 * r, radius: r, weight: weightOf.get(id) }
  })
  return { nodes, childrenOf, weightOf }
}

/** Heaviest child of the heaviest root that has children. */
function heaviestSatellite(fx, childrenOf, weightOf) {
  const hasParent = new Set(fx.edges.map(e => e.target))
  const roots = fx.ids.filter(id => !hasParent.has(id) && childrenOf.has(id))
  const by = ids => [...ids].sort((a, b) => weightOf.get(b) - weightOf.get(a))[0]
  const sun = by(roots)
  return { sun, satellite: by(childrenOf.get(sun)) }
}

function overlaps(nodes, pos) {
  // Grid-bucketed circle overlap count (bodies are round); 0.5 px tolerance.
  const cell = Math.max(...nodes.map(n => n.radius)) * 2
  const grid = new Map()
  let count = 0
  for (const n of nodes) {
    const p = pos.get(n.id)
    const cx = Math.floor(p.x / cell)
    const cy = Math.floor(p.y / cell)
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        for (const m of grid.get(`${gx},${gy}`) ?? []) {
          const q = pos.get(m.id)
          if (Math.hypot(p.x - q.x, p.y - q.y) < n.radius + m.radius - 0.5) count++
        }
      }
    }
    const key = `${cx},${cy}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(n)
  }
  return count
}

const fmt = ms => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms.toFixed(1)} ms`)

function run(fx) {
  const { nodes, childrenOf, weightOf } = bodies(fx)
  // A fresh edges array per run: galaxyLayout's caches key on its identity, so every run starts cold.
  const edges = fx.edges.map(e => ({ ...e }))
  const options = { aspectRatio: 1.6 }
  const { sun, satellite } = heaviestSatellite(fx, childrenOf, weightOf)
  const start = L.galaxyLayout(nodes, edges, options)
  // An idle tick first, as a live session has before any drag (fills the construction cache).
  let pos = L.galaxySimulationStep(nodes, edges, start, options)
  const s = start.get(satellite)
  const t = start.get(sun)
  const len = Math.hypot(t.x - s.x, t.y - s.y) || 1
  const step = { x: ((t.x - s.x) / len) * 50, y: ((t.y - s.y) / len) * 50 }
  const pinned = at => nodes.map(n => (n.id === satellite ? { ...n, x: at.x, y: at.y, pinned: true } : n))
  const frames = []
  let at = s
  for (let f = 1; f <= 3; f++) {
    at = { x: s.x + step.x * f, y: s.y + step.y * f }
    const input = pinned(at)
    const t0 = performance.now()
    pos = L.galaxySimulationStep(input, edges, pos, options)
    frames.push(performance.now() - t0)
  }
  // Released: the pin holds still. Ticks continue until nothing moves; galaxySimulationSettling
  // (when this copy has it) says the pinned target itself is still being finished.
  const released = pinned(at)
  let release = 0
  let targetTicks = 0
  let settling = true
  for (let tick = 0; tick < 2000; tick++) {
    const t0 = performance.now()
    const next = L.galaxySimulationStep(released, edges, pos, options)
    release = Math.max(release, performance.now() - t0)
    settling = L.galaxySimulationSettling?.() ?? false
    if (settling) targetTicks = tick + 1
    let moved = 0
    for (const [id, p] of next) moved = Math.max(moved, Math.hypot(p.x - pos.get(id).x, p.y - pos.get(id).y))
    pos = next
    if (moved < 0.01 && !settling) break
  }
  const p = pos.get(satellite)
  return {
    label: fx.label,
    n: nodes.length,
    frames,
    release,
    targetTicks: targetTicks + 1,
    overlaps: overlaps(nodes, pos),
    atPin: p.x === at.x && p.y === at.y,
  }
}

console.log(`galaxy drag benchmark — ${path.relative(root, src) || src}`)
console.log('| Graph | Nodes | Drag frames 1 / 2 / 3 | Slowest tick after release | Ticks to final target | Settled overlaps | Dropped node at pin |')
console.log('|---|---|---|---|---|---|---|')
for (const fx of fixtures) {
  // Best of `repeat` runs per frame.
  let best
  for (let r = 0; r < repeat; r++) {
    const res = run(fx)
    if (!best) best = res
    else {
      best.frames = best.frames.map((ms, i) => Math.min(ms, res.frames[i]))
      best.release = Math.min(best.release, res.release)
    }
    // A single run of a frame this slow is already a clear measurement.
    if (Math.max(...res.frames) > 2000) break
  }
  console.log(`| ${best.label} | ${best.n} | ${best.frames.map(fmt).join(' / ')} | ${fmt(best.release)} | ${best.targetTicks} | ${best.overlaps} | ${best.atPin ? 'yes' : 'NO'} |`)
}
