import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './tests/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      /* ---- Colors — all reference CSS custom properties with opacity support ---- */
      colors: {
        /* Shell surface */
        'shell-bg': 'rgb(var(--shell-bg) / <alpha-value>)',
        'shell-surface': 'rgb(var(--shell-surface) / <alpha-value>)',
        'shell-fg-1': 'rgb(var(--shell-fg-1) / <alpha-value>)',
        'shell-fg-2': 'rgb(var(--shell-fg-2) / <alpha-value>)',
        'shell-fg-3': 'rgb(var(--shell-fg-3) / <alpha-value>)',

        /* Canvas surface */
        'canvas-bg': 'rgb(var(--canvas-bg) / <alpha-value>)',
        'canvas-surface': 'rgb(var(--canvas-surface) / <alpha-value>)',
        'canvas-card': 'rgb(var(--canvas-card) / <alpha-value>)',
        'canvas-bg-2': 'rgb(var(--canvas-bg-2) / <alpha-value>)',
        'canvas-fg-1': 'rgb(var(--canvas-fg-1) / <alpha-value>)',
        'canvas-fg-2': 'rgb(var(--canvas-fg-2) / <alpha-value>)',
        'canvas-fg-3': 'rgb(var(--canvas-fg-3) / <alpha-value>)',
        'canvas-border': 'rgb(var(--canvas-border) / <alpha-value>)',
        'canvas-border-strong': 'rgb(var(--canvas-border-strong) / <alpha-value>)',

        /* Accent primary (amber) */
        'accent-primary': 'rgb(var(--accent-primary) / <alpha-value>)',
        'accent-primary-hover': 'rgb(var(--accent-primary-hover) / <alpha-value>)',
        'accent-primary-deep': 'rgb(var(--accent-primary-deep) / <alpha-value>)',

        /* Semantic status colors */
        'status-ok': 'rgb(var(--status-ok) / <alpha-value>)',
        'status-ok-bg': 'rgb(var(--status-ok-bg) / <alpha-value>)',
        'status-ok-fg': 'rgb(var(--status-ok-fg) / <alpha-value>)',
        'status-warn': 'rgb(var(--status-warn) / <alpha-value>)',
        'status-warn-bg': 'rgb(var(--status-warn-bg) / <alpha-value>)',
        'status-warn-fg': 'rgb(var(--status-warn-fg) / <alpha-value>)',
        'status-error': 'rgb(var(--status-error) / <alpha-value>)',
        'status-error-bg': 'rgb(var(--status-error-bg) / <alpha-value>)',
        'status-error-fg': 'rgb(var(--status-error-fg) / <alpha-value>)',
        'status-cyan': 'rgb(var(--status-cyan) / <alpha-value>)',
        'status-emerald': 'rgb(var(--status-emerald) / <alpha-value>)',
        'status-amber': 'rgb(var(--status-amber) / <alpha-value>)',
        'status-rose': 'rgb(var(--status-rose) / <alpha-value>)',
        'status-violet': 'rgb(var(--status-violet) / <alpha-value>)',

        /* Neutral grays */
        'gray-50': 'rgb(var(--gray-50) / <alpha-value>)',
        'gray-100': 'rgb(var(--gray-100) / <alpha-value>)',
        'gray-200': 'rgb(var(--gray-200) / <alpha-value>)',
        'gray-300': 'rgb(var(--gray-300) / <alpha-value>)',
        'gray-400': 'rgb(var(--gray-400) / <alpha-value>)',
        'gray-500': 'rgb(var(--gray-500) / <alpha-value>)',
        'gray-600': 'rgb(var(--gray-600) / <alpha-value>)',
        'gray-700': 'rgb(var(--gray-700) / <alpha-value>)',
        'gray-800': 'rgb(var(--gray-800) / <alpha-value>)',
        'gray-900': 'rgb(var(--gray-900) / <alpha-value>)',
      },

      /* ---- Border Radius ---- */
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },

      /* ---- Box Shadows ---- */
      boxShadow: {
        none: 'var(--shadow-none)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        modal: 'var(--shadow-modal)',
      },

      /* ---- Font Families ---- */
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
      },

      /* ---- Font Sizes ---- */
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
      },

      /* ---- Font Weights ---- */
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      /* ---- Spacing ---- */
      spacing: {
        '0.5': 'var(--space-0_5)',
        '1': 'var(--space-1)',
        '1.5': 'var(--space-1_5)',
        '2': 'var(--space-2)',
        '2.5': 'var(--space-2_5)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
      },

      /* ---- Ring (focus state) ---- */
      ringColor: {
        DEFAULT: 'rgb(var(--accent-primary) / <alpha-value>)',
      },
      ringOffsetColor: {
        DEFAULT: 'rgb(var(--canvas-bg) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}

export default config
