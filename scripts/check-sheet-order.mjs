#!/usr/bin/env node
/* global window, document, getComputedStyle -- page.evaluate callbacks run in the browser */
// Checks that the opt-in stylesheets don't depend on load order (0.13.0).
//
// A component sheet (dist/css/<Name>.css) includes the CSS of every component it renders, so two
// sheets can repeat a rule. If a component adjusts another one it renders with a selector of equal
// specificity (`.lineage-rail__node` over Chip's `.chip--neutral`), it wins only when its rule loads
// last, and a later sheet's copy of the other component's rules undoes it. This script loads each
// dev-app test page, swaps the library's dev CSS for dist/style.css, records every element's
// computed style, then loads dist/css/base.css plus every component sheet in several orders
// (alphabetical, reversed, two shuffles) and reports each element whose computed style differs.
//
// Usage (needs `npm run build` and the dev server, `npm run dev` or any port):
//   node scripts/check-sheet-order.mjs [--url http://127.0.0.1:5173] [--pages a,b] [--dark] [--dist dist] [--out file.json]
// --pages defaults to every `?example=` page in src/App.tsx; --dark also runs each page on dark
// canvas. Exits 1 when any element differs. Slow (a few minutes for all pages); not run in CI.

import { chromium } from '@playwright/test'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}
const url = arg('url', 'http://127.0.0.1:5173')
const dark = process.argv.includes('--dark')
const out = arg('out', null)
const allPages = [...readFileSync(path.join(root, 'src/App.tsx'), 'utf8').matchAll(/exampleParam === '([^']+)'/g)].map((m) => m[1])
const pages = arg('pages', null)?.split(',') ?? [...new Set(allPages)]

const dist = path.resolve(root, arg('dist', 'dist'))
const read = (file) => readFileSync(path.join(dist, file), 'utf8')
const full = read('style.css')
const base = read('css/base.css')
const names = readdirSync(path.join(dist, 'css'))
  .filter((f) => f.endsWith('.css') && f !== 'base.css')
  .map((f) => f.slice(0, -4))
  .sort()
function shuffle(list, seed) {
  const a = [...list]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const sheetsIn = (order) => [base, ...order.map((n) => read(`css/${n}.css`))].join('\n')
const variants = {
  alphabetical: sheetsIn(names),
  reversed: sheetsIn([...names].reverse()),
  shuffled7: sheetsIn(shuffle(names, 7)),
  shuffled99: sheetsIn(shuffle(names, 99)),
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
const results = {}
let total = 0
for (const name of pages) {
  for (const theme of dark ? ['light', 'dark'] : ['light']) {
    const key = `${name}${theme === 'dark' ? ':dark' : ''}`
    const page = await context.newPage()
    await page.goto(`${url}/?example=${name}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    if (theme === 'dark') await page.evaluate(() => document.body.classList.add('dark-canvas'))
    await page.evaluate(() => {
      // Drop the library's own dev stylesheets; the page's index.css and inline styles stay.
      for (const s of document.querySelectorAll('style[data-vite-dev-id]')) {
        if (/\/src\/(components|tokens|styles)\//.test(s.getAttribute('data-vite-dev-id'))) s.remove()
      }
      const variant = document.createElement('style')
      variant.id = '__variant'
      document.head.appendChild(variant)
      const still = document.createElement('style')
      still.textContent = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}'
      document.head.appendChild(still)
      const props = [...getComputedStyle(document.body)]
      const describe = (el) =>
        el.tagName.toLowerCase() + (el.getAttribute('class') ? '.' + String(el.getAttribute('class')).trim().split(/\s+/).join('.') : '')
      window.__snap = () =>
        [...document.querySelectorAll('body *')].map((el) =>
          [null, '::before', '::after'].map((pseudo) => {
            const cs = getComputedStyle(el, pseudo)
            if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return ''
            return props.map((p) => cs.getPropertyValue(p)).join('\u0001')
          })
        )
      window.__diff = (a, b) => {
        const els = [...document.querySelectorAll('body *')]
        if (a.length !== b.length) return [{ el: 'body', props: [['element count', a.length, b.length]] }]
        const diffs = []
        for (let i = 0; i < a.length; i++) {
          for (let k = 0; k < 3; k++) {
            if (a[i][k] === b[i][k]) continue
            const x = a[i][k].split('\u0001')
            const y = b[i][k].split('\u0001')
            const changed = props.flatMap((p, j) => (x[j] === y[j] ? [] : [[p, x[j], y[j]]]))
            diffs.push({ el: describe(els[i]), pseudo: [null, '::before', '::after'][k], props: changed })
          }
        }
        return diffs
      }
    })
    const setCss = async (css) => {
      await page.evaluate((c) => {
        document.getElementById('__variant').textContent = c
        void document.body.offsetHeight
      }, css)
      await page.waitForTimeout(150)
    }
    await setCss(full)
    await page.evaluate(() => (window.__full = window.__snap()))
    await page.waitForTimeout(300)
    // Properties that change on their own (live data, measured layouts) aren't the sheets' doing.
    const noise = await page.evaluate(() => window.__diff(window.__full, window.__snap()))
    const noisy = new Set(noise.flatMap((d) => d.props.map(([p]) => `${d.el}|${p}`)))
    results[key] = {}
    for (const [variant, css] of Object.entries(variants)) {
      await setCss(css)
      const diffs = (await page.evaluate(() => window.__diff(window.__full, window.__snap())))
        .map((d) => ({ ...d, props: d.props.filter(([p]) => !noisy.has(`${d.el}|${p}`)) }))
        .filter((d) => d.props.length > 0)
      results[key][variant] = diffs
      total += diffs.length
    }
    await page.close()
    const counts = Object.entries(results[key]).map(([v, d]) => `${v} ${d.length}`)
    console.log(`${key}: ${counts.join(', ')}`)
    for (const d of Object.values(results[key]).flat().slice(0, 3)) {
      console.log(`  ${d.el}${d.pseudo ?? ''}: ${d.props.slice(0, 4).map(([p, a, b]) => `${p} ${a} -> ${b}`).join('; ')}`)
    }
  }
}
await browser.close()
if (out) writeFileSync(out, JSON.stringify(results, null, 1))
console.log(`check-sheet-order: ${total} order-dependent element style(s) across ${Object.keys(results).length} page(s)`)
process.exit(total > 0 ? 1 : 0)
