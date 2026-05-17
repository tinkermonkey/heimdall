# Heimdall UI Design System

Production component library for the Heimdall design system. Built with React 18, TypeScript, Tailwind CSS, and self-hosted fonts.

## Phase 1: Foundation

This phase establishes the token system and build infrastructure required by all subsequent component work.

### ✅ Completed

- Vite + React 18 + TypeScript + Tailwind CSS build pipeline
- CSS custom property token system (dark canvas default mode)
- Orange accent tokens (placeholders pending final hex from design)
- Self-hosted Inter and JetBrains Mono fonts (local file declarations)
- Tailwind theme extending with CSS variable references
- Playwright testing infrastructure with animation freezing utilities
- Base test utilities for font loading, dark-canvas toggle, and token validation
- Barrel export at `src/index.ts` (initially empty)

### Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with UI
npm run test:ui
```

### Project Structure

```
src/
├── fonts/
│   ├── fonts.css              # @font-face declarations
│   ├── inter/                 # Inter font files (self-hosted)
│   └── jetbrains-mono/        # JetBrains Mono files (self-hosted)
├── tokens/
│   └── tokens.css             # Design tokens as CSS custom properties
├── index.css                  # Main stylesheet (tokens + Tailwind)
├── index.ts                   # Barrel export (empty, for future components)
├── main.tsx                   # Vite entry point
└── App.tsx                    # Root component

tests/
├── foundation.spec.ts         # Token system validation tests
└── utils/
    └── test-helpers.ts        # Test utilities

tailwind.config.ts             # Tailwind theme extending CSS variables
playwright.config.ts           # Playwright testing configuration
postcss.config.js              # PostCSS + Tailwind + Autoprefixer
vite.config.ts                 # Vite build configuration
```

### Design Token Reference

#### Two-Surface Architecture

Every screen has exactly two surfaces:

- **Shell**: Always dark (`#0B0F14`)
- **Canvas**: Dark default (`#14191F`)

Token variables automatically resolve based on surface context. No component-level conditional rendering needed.

#### Accent Color (Orange)

```css
--accent-primary:       #f97316   /* bright, active states */
--accent-primary-hover: #ea580c   /* hover state */
--accent-primary-deep:  #c2410c   /* deep/CTA */
```

⚠️ **TODO**: Replace orange placeholder values with final hex codes from design.

#### Semantic Status Colors

```css
--status-ok:       #22c55e   /* emerald, ok/running */
--status-warn:     #eab308   /* amber, warn/degraded */
--status-error:    #ef4444   /* rose, error/failed */
--status-emerald:  #10b981
--status-amber:    #f59e0b
--status-rose:     #f43f5e
--status-violet:   #8b5cf6
```

### Font Files

Font files are declared but not yet self-hosted. Download from:

- **Inter**: https://github.com/rsms/inter/releases (weights: 300–900)
- **JetBrains Mono**: https://github.com/JetBrains/JetBrainsMono/releases (weights: 400, 500, 600)

Place `.woff2` files in `src/fonts/{inter,jetbrains-mono}/` directories.

### Build Output

The library builds to ES modules with TypeScript types:

```
dist/
├── index.js        # Component library
├── index.d.ts      # TypeScript declarations
└── style.css       # Compiled CSS (tokens + components)
```

### Testing

Tests validate:

- Dark canvas tokens applied by default
- Orange accent color (not cyan)
- Semantic status colors
- Radius and spacing scale
- Animation freezing for consistent screenshots
- Font loading and dark-canvas class application

Run tests:

```bash
npm test              # Headless mode
npm run test:ui       # Interactive UI
```

## Next Phase: Components

Phase 2 will introduce:

- `Icon` — ICONS map + SVG renderer
- `Button` — 5 variants × 2 sizes × states
- `Chip` — 6 semantic color variants
- Visual regression tests against reference prototypes
