#!/usr/bin/env node
/**
 * Performance measurement script for bundle size and render time
 * This script captures baseline metrics for Phase 7 integration validation
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '../dist')
const resultFile = path.join(__dirname, '../performance-baseline.json')

function getFileSizeInKb(filePath) {
  const stats = fs.statSync(filePath)
  return (stats.size / 1024).toFixed(2)
}

function measureBundleSize() {
  console.log('📦 Measuring bundle size...')

  const metrics = {
    timestamp: new Date().toISOString(),
    buildDate: new Date().toLocaleString(),
    components: {
      count: 18, // Total exported components
      categories: {
        primitives: ['Button', 'Chip', 'Badge', 'StatusBadge'],
        inputs: ['TextInput', 'TextArea', 'NumberInput', 'Select', 'TriState', 'Field'],
        dataDisplay: ['StatTile', 'Table'],
        navigation: ['NavItem', 'Sidebar', 'Topbar', 'TabBar'],
        shell: ['Titlebar', 'Statusbar', 'ShellLayout'],
      },
    },
    bundleSizes: {},
  }

  // Measure CSS file
  const cssPath = path.join(distDir, 'style.css')
  if (fs.existsSync(cssPath)) {
    const cssSize = getFileSizeInKb(cssPath)
    metrics.bundleSizes.css = `${cssSize} KB`
    console.log(`  ✓ style.css: ${cssSize} KB`)
  }

  // Measure JS file
  const jsPattern = /index.*\.js$/
  const jsFiles = fs.readdirSync(distDir).filter((f) => jsPattern.test(f))
  jsFiles.forEach((file) => {
    const jsPath = path.join(distDir, file)
    const jsSize = getFileSizeInKb(jsPath)
    metrics.bundleSizes[file] = `${jsSize} KB`
    console.log(`  ✓ ${file}: ${jsSize} KB`)
  })

  // Calculate total
  const totalSize = Object.values(metrics.bundleSizes)
    .reduce((acc, size) => {
      const num = parseFloat(size)
      return acc + num
    }, 0)
    .toFixed(2)
  metrics.bundleSizes.total = `${totalSize} KB`
  console.log(`  ✓ Total: ${totalSize} KB\n`)

  return metrics
}

function estimateRenderMetrics() {
  console.log('⚡ Estimated render metrics (targets, not measured)...')

  const metrics = {
    renderMetricsEstimated: true,
    renderMetricsNote: 'These are target estimates based on component complexity. Actual measurements should be captured using Playwright performance API in CI.',
    components: {
      average: '< 1ms',
      slowest: 'ShellLayout (5-10ms with full props)',
    },
    integration: {
      rebuiltViewRenderTime: '< 50ms',
      previewCardsRenderTime: '< 500ms total',
      docsAppRenderTime: '< 100ms',
    },
    notes: [
      'Render metrics are estimates based on component complexity, not measured values',
      'Components use CSS-in-JS and Tailwind for styling',
      'Render times represent target performance goals',
      'Actual measurements should be captured using Playwright performance API',
    ],
  }

  console.log(`  ✓ Individual component render (est): ${metrics.components.average}`)
  console.log(`  ✓ Rebuilt view (est): ${metrics.integration.rebuiltViewRenderTime}`)
  console.log(`  ✓ Preview cards (est): ${metrics.integration.previewCardsRenderTime}`)
  console.log(`  ✓ Docs app (est): ${metrics.integration.docsAppRenderTime}\n`)

  return metrics
}

function generateReport() {
  console.log('📊 Phase 7 Integration Validation - Performance Baseline\n')

  const bundleMetrics = measureBundleSize()
  const renderMetrics = estimateRenderMetrics()

  const fullReport = {
    phase: 'Phase 7: Integration Validation',
    description: 'Design system faithfully reproduces reference applications using only design system exports',
    generatedAt: new Date().toISOString(),
    ...bundleMetrics,
    ...renderMetrics,
  }

  // Save to file
  fs.writeFileSync(resultFile, JSON.stringify(fullReport, null, 2))
  console.log(`✅ Performance baseline saved to performance-baseline.json`)
  console.log('\n📈 Key Metrics:')
  console.log(`   • Bundle Size: ${bundleMetrics.bundleSizes.total}`)
  console.log(`   • Rebuilt View Render: ${renderMetrics.integration.rebuiltViewRenderTime}`)
  console.log(`   • Components: ${bundleMetrics.components.count} total`)
}

generateReport()
