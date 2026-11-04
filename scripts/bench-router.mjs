#!/usr/bin/env node
// Navigation-route benchmark for routeNavigationEdges (utils/channelRouter.ts).
//
// GraphCanvas reruns the router whenever node rects change (re-measure, drag), so its cost per
// batch is what a user feels. This routes a grid of N boxes (150 x 120 px pitch, 100 x 23 px boxes,
// like ux-navigation's cards) with N seeded random edges, for N = 50, 100, 200, 400, and prints
// the median time of --repeat runs plus a fingerprint of the routes (so a pure speed-up can be
// checked to leave the output unchanged).
//
// Usage:
//   node scripts/bench-router.mjs [--src path/to/channelRouter.ts] [--repeat 5] [--sizes 50,100,200,400]
//   node scripts/bench-router.mjs --check     # exit 1 if a size exceeds its budget (below)
//
// --src benchmarks another copy of channelRouter.ts (e.g. one checked out from main:
// `git show main:src/utils/channelRouter.ts > /tmp/r/channelRouter.ts`, with graph.ts beside it).
import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const opt = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt)
const src = path.resolve(opt('--src', path.join(root, 'src/utils/channelRouter.ts')))
const repeat = Number(opt('--repeat', 5))
const sizes = opt('--sizes', '50,100,200,400').split(',').map(Number)
const check = args.includes('--check')

/** Budget (ms, median) per size for --check: generous against machine variance, far below the
 *  3.5 s a 400-node batch took before the 2026-11-04 bounds (tinkermonkey/heimdall#324). */
const BUDGET = { 50: 20, 100: 40, 200: 100, 400: 250 }

const bundled = await build({ entryPoints: [src], bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'error', nodePaths: [path.join(root, 'node_modules')] })
const R = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)

function grid(n) {
  const cols = Math.ceil(Math.sqrt(n))
  return Array.from({ length: n }, (_, i) => ({ x: (i % cols) * 150, y: Math.floor(i / cols) * 120, width: 100, height: 23 }))
}

function edgesFor(boxes) {
  let seed = 1
  const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647)
  const n = boxes.length
  return Array.from({ length: n }, (_, i) => ({ id: `e${i}`, source: boxes[Math.floor(rnd() * n)], target: boxes[Math.floor(rnd() * n)] }))
    .filter(e => e.source !== e.target)
}

/** Route quality, so a speed-up that buys time with worse routes shows: proper crossings between
 *  routes, total length, and segments running through a box other than the route's own ends. */
function quality(edges, routes, boxes) {
  const segs = edges.map(e => { const p = routes.get(e.id).points; return p.slice(1).map((b, i) => [p[i], b]) })
  let crossings = 0
  let length = 0
  let through = 0
  segs.forEach((own, i) => {
    for (const [a, b] of own) {
      length += Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
      for (const box of boxes) {
        if (box === edges[i].source || box === edges[i].target) continue
        const l = box.x - box.width / 2, r = box.x + box.width / 2, t = box.y - box.height / 2, bt = box.y + box.height / 2
        if (Math.max(a.x, b.x) > l && Math.min(a.x, b.x) < r && Math.max(a.y, b.y) > t && Math.min(a.y, b.y) < bt) through++
      }
      for (const other of segs.slice(i + 1)) {
        for (const [c, d] of other) {
          const [h, hb, v, vb] = a.y === b.y ? [a, b, c, d] : [c, d, a, b]
          if (h.y !== hb.y || v.x !== vb.x) continue
          if (v.x > Math.min(h.x, hb.x) && v.x < Math.max(h.x, hb.x) && h.y > Math.min(v.y, vb.y) && h.y < Math.max(v.y, vb.y)) crossings++
        }
      }
    }
  })
  return { crossings, length: Math.round(length), through }
}

let failed = false
console.log('nodes  edges  median ms  crossings  length px  segs through boxes  fingerprint')
for (const n of sizes) {
  const boxes = grid(n)
  const edges = edgesFor(boxes)
  const times = []
  let routes
  for (let r = 0; r < repeat; r++) {
    const t = performance.now()
    routes = R.routeNavigationEdges(edges, boxes)
    times.push(performance.now() - t)
  }
  times.sort((a, b) => a - b)
  const median = times[Math.floor(times.length / 2)]
  const fp = createHash('sha1').update(edges.map(e => routes.get(e.id).d).join('|')).digest('hex').slice(0, 10)
  const over = check && BUDGET[n] !== undefined && median > BUDGET[n]
  if (over) failed = true
  const q = quality(edges, routes, boxes)
  console.log(`${String(n).padStart(5)}  ${String(edges.length).padStart(5)}  ${median.toFixed(1).padStart(9)}  ${String(q.crossings).padStart(9)}  ${String(q.length).padStart(9)}  ${String(q.through).padStart(18)}  ${fp}${over ? `  OVER BUDGET (${BUDGET[n]} ms)` : ''}`)
}
if (failed) process.exit(1)
