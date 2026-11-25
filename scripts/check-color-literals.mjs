#!/usr/bin/env node
// Checks that component code takes its colors from tokens, so a theme (src/tokens/theme.css) can
// restyle every one of them (#402).
//
// Scans src/**/*.{css,ts,tsx}, skipping src/tokens/, src/test-pages/ and *.test.* files. Comments
// are stripped first, so `#320` in a comment is not a color.
//
// Fails on:
//   - hex colors: #rgb, #rgba, #rrggbb, #rrggbbaa
//   - rgb() / rgba() / hsl() / hsla() whose arguments are numbers
//   - var(--x, N, N, N): a numeric RGB fallback for a token
//
// Allowed:
//   - pure black and white at any alpha (#000, #ffffff80, rgb(0 0 0 / .5), rgba(255,255,255,0.4),
//     hsl(0 0% 100%)): scrims, shadows and text on saturated fills, not theme colors
//   - rgb(var(--token)) and rgb(var(--token) / 0.2): the arguments are not numbers
//
// What is not a hex color:
//   - `#` preceded by `/` (a URL fragment), a word character, `&` (an HTML entity such as `&#123;`)
//     or another `#`; or followed by a word character or `-` (`#header`, `#a1b2c3d`)
//   - in CSS, a `#` token in a selector: the next `{`, `;` or `}` after it is a `{` (`#root {`,
//     `#cafe .x {`). A value always ends at `;` or `}` first.
//
// A numeric var() fallback is flagged even when it is black or white: the token is the color, and
// the fallback only hides a missing token.
//
// Usage: npm run check:colors
//        node scripts/check-color-literals.mjs [dir]   (scan another directory, e.g. fixtures)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCAN_DIR = path.resolve(process.argv[2] ?? path.join(ROOT, 'src'))
const EXCLUDED_DIRS = new Set(['tokens', 'test-pages'])
const rel = (p) => path.relative(process.cwd(), p)

// ---------------------------------------------------------------------------
// Files

function listFiles(dir, top = true) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (top && EXCLUDED_DIRS.has(entry.name)) continue
      files.push(...listFiles(full, false))
    } else if (/\.(css|ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

// ---------------------------------------------------------------------------
// Comment stripping. Comments become spaces (newlines kept) so offsets and line numbers still
// match the source. Strings are kept: a color in a string is still a color.

const blank = (s) => s.replace(/[^\n]/g, ' ')

function stripCssComments(src) {
  let out = ''
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === '"' || c === "'") {
      const end = endOfQuoted(src, i, c)
      out += src.slice(i, end)
      i = end
    } else if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2)
      const end = close === -1 ? src.length : close + 2
      out += blank(src.slice(i, end))
      i = end
    } else {
      out += c
      i++
    }
  }
  return out
}

// Index just past a '...' or "..." string starting at `start` (stops at an unescaped newline).
function endOfQuoted(src, start, quote) {
  let i = start + 1
  while (i < src.length && src[i] !== quote && src[i] !== '\n') i += src[i] === '\\' ? 2 : 1
  return Math.min(i + 1, src.length)
}

// A `/` starts a regex literal (not division) when the previous significant token can't end an
// expression.
// `<` and `>` are left out: in TSX they are far more often `</tag>` and `=>` than a comparison
// followed by a regex.
const REGEX_PRECEDERS = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '~', '^'])
const REGEX_KEYWORDS = /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/

function stripTsComments(src) {
  let out = ''
  let i = 0
  const templateDepth = [] // brace depth at each open `${`
  let braces = 0
  let lastSignificant = ''

  while (i < src.length) {
    const c = src[i]
    const next = src[i + 1]

    if (c === '/' && next === '/') {
      let end = src.indexOf('\n', i)
      if (end === -1) end = src.length
      out += blank(src.slice(i, end))
      i = end
      continue
    }
    if (c === '/' && next === '*') {
      const close = src.indexOf('*/', i + 2)
      const end = close === -1 ? src.length : close + 2
      out += blank(src.slice(i, end))
      i = end
      continue
    }
    if (c === '"' || c === "'") {
      const end = endOfQuoted(src, i, c)
      out += src.slice(i, end)
      i = end
      lastSignificant = c
      continue
    }
    if (c === '`') {
      i = copyTemplate(i)
      lastSignificant = '`'
      continue
    }
    if (c === '/' && (REGEX_PRECEDERS.has(lastSignificant) || REGEX_KEYWORDS.test(out.trimEnd()))) {
      const end = endOfRegex(src, i)
      out += src.slice(i, end)
      i = end
      lastSignificant = '/'
      continue
    }
    if (c === '{') braces++
    if (c === '}') {
      if (templateDepth.length && templateDepth[templateDepth.length - 1] === braces) {
        // end of a `${...}` substitution: back inside the template string
        templateDepth.pop()
        out += c
        i = copyTemplate(i, true)
        lastSignificant = '`'
        continue
      }
      braces--
    }
    out += c
    i++
    if (!/\s/.test(c)) lastSignificant = /[\w$]/.test(c) ? 'w' : c
  }
  return out

  // Copies template text from the opening backtick (or the `}` closing a substitution) up to and
  // including the closing backtick or the next `${`. Returns the index after what it copied.
  function copyTemplate(start, resume = false) {
    let j = start + 1
    while (j < src.length) {
      if (src[j] === '\\') {
        j += 2
        continue
      }
      if (src[j] === '`') {
        out += src.slice(resume ? start + 1 : start, j + 1)
        return j + 1
      }
      if (src[j] === '$' && src[j + 1] === '{') {
        out += src.slice(resume ? start + 1 : start, j + 2)
        braces++
        templateDepth.push(braces)
        lastSignificant = '{'
        return j + 2
      }
      j++
    }
    out += src.slice(resume ? start + 1 : start)
    return src.length
  }
}

function endOfRegex(src, start) {
  let i = start + 1
  let inClass = false
  while (i < src.length && src[i] !== '\n') {
    const c = src[i]
    if (c === '\\') {
      i += 2
      continue
    }
    if (c === '[') inClass = true
    else if (c === ']') inClass = false
    else if (c === '/' && !inClass) {
      i++
      while (i < src.length && /[a-z]/i.test(src[i])) i++
      return i
    }
    i++
  }
  return i
}

// ---------------------------------------------------------------------------
// Rules

const HEX = /(?<![\w/&#])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g
const COLOR_FN = /\b(rgba?|hsla?)\(([^()]*)\)/gi
const VAR_FALLBACK = /var\(\s*--[\w-]+\s*,\s*[\d.]+%?(?:\s*,\s*|\s+)[\d.]+%?(?:\s*,\s*|\s+)[\d.]+%?\s*\)/g

function isBlackOrWhiteHex(digits) {
  const d = digits.toLowerCase()
  const rgb = d.length <= 4 ? d.slice(0, 3) : d.slice(0, 6)
  return /^0+$/.test(rgb) || /^f+$/.test(rgb)
}

const num = (s) => Number.parseFloat(s)

// `args` are the arguments of a color function. Undefined when they are not numbers.
function colorFnKind(fn, args) {
  const parts = args.trim().split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3 || !parts.slice(0, 3).every((p) => /^[-+]?[\d.]+(?:%|deg|turn|rad)?$/.test(p))) return undefined
  if (fn.toLowerCase().startsWith('rgb')) {
    const [r, g, b] = parts.slice(0, 3).map((p) => (p.endsWith('%') ? (num(p) / 100) * 255 : num(p)))
    if (r === 0 && g === 0 && b === 0) return 'black'
    if (r === 255 && g === 255 && b === 255) return 'white'
    return 'color'
  }
  const lightness = num(parts[2])
  if (lightness === 0) return 'black'
  if (lightness === 100) return 'white'
  return 'color'
}

// In CSS, true when the match at `index` sits in a selector: the next `{`, `;` or `}` is a `{`.
function inCssSelector(text, index) {
  const m = /[{;}]/.exec(text.slice(index))
  return m?.[0] === '{'
}

function scan(file) {
  const source = fs.readFileSync(file, 'utf8')
  const isCss = file.endsWith('.css')
  const text = isCss ? stripCssComments(source) : stripTsComments(source)
  const hits = []
  const lineOf = (index) => text.slice(0, index).split('\n').length

  for (const m of text.matchAll(HEX)) {
    if (isBlackOrWhiteHex(m[1])) continue
    if (isCss && inCssSelector(text, m.index)) continue
    hits.push({ index: m.index, literal: m[0] })
  }
  for (const m of text.matchAll(COLOR_FN)) {
    if (colorFnKind(m[1], m[2]) === 'color') hits.push({ index: m.index, literal: m[0] })
  }
  for (const m of text.matchAll(VAR_FALLBACK)) {
    hits.push({ index: m.index, literal: m[0] })
  }

  return hits
    .sort((a, b) => a.index - b.index)
    .map((h) => ({ file, line: lineOf(h.index), literal: h.literal.replace(/\s+/g, ' ') }))
}

// ---------------------------------------------------------------------------

if (!fs.existsSync(SCAN_DIR)) {
  console.error(`check:colors: ${rel(SCAN_DIR)} does not exist`)
  process.exit(2)
}

const files = listFiles(SCAN_DIR)
const hits = files.flatMap(scan)

if (hits.length) {
  for (const h of hits) console.log(`${rel(h.file)}:${h.line}: ${h.literal}`)
  console.log(
    `\ncheck:colors: ${hits.length} color literal${hits.length === 1 ? '' : 's'} in ` +
      `${new Set(hits.map((h) => h.file)).size} file(s). Use a token from src/tokens/tokens.css ` +
      `(rgb(var(--token)) in CSS and TS alike), or add one there.`,
  )
  process.exit(1)
}
console.log(`check:colors: no color literals in ${files.length} files under ${rel(SCAN_DIR) || '.'}.`)
