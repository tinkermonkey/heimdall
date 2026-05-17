import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './tests/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      /* ---- Colors — all reference CSS custom properties ---- */
      colors: {
        /* Shell surface */
        'shell-bg': 'var(--shell-bg)',
        'shell-surface': 'var(--shell-surface)',
        'shell-fg-1': 'var(--shell-fg-1)',
        'shell-fg-2': 'var(--shell-fg-2)',
        'shell-fg-3': 'var(--shell-fg-3)',

        /* Canvas surface */
        'canvas-bg': 'var(--canvas-bg)',
        'canvas-surface': 'var(--canvas-surface)',
        'canvas-card': 'var(--canvas-card)',
        'canvas-bg-2': 'var(--canvas-bg-2)',
        'canvas-fg-1': 'var(--canvas-fg-1)',
        'canvas-fg-2': 'var(--canvas-fg-2)',
        'canvas-fg-3': 'var(--canvas-fg-3)',
        'canvas-border': 'var(--canvas-border)',
        'canvas-border-strong': 'var(--canvas-border-strong)',

        /* Accent primary (orange) */
        'accent-primary': 'var(--accent-primary)',
        'accent-primary-hover': 'var(--accent-primary-hover)',
        'accent-primary-deep': 'var(--accent-primary-deep)',

        /* Semantic status colors */
        'status-ok': 'var(--status-ok)',
        'status-ok-bg': 'var(--status-ok-bg)',
        'status-ok-fg': 'var(--status-ok-fg)',
        'status-warn': 'var(--status-warn)',
        'status-warn-bg': 'var(--status-warn-bg)',
        'status-warn-fg': 'var(--status-warn-fg)',
        'status-error': 'var(--status-error)',
        'status-error-bg': 'var(--status-error-bg)',
        'status-error-fg': 'var(--status-error-fg)',
        'status-emerald': 'var(--status-emerald)',
        'status-amber': 'var(--status-amber)',
        'status-rose': 'var(--status-rose)',
        'status-violet': 'var(--status-violet)',

        /* Neutral grays */
        'gray-50': 'var(--gray-50)',
        'gray-100': 'var(--gray-100)',
        'gray-200': 'var(--gray-200)',
        'gray-300': 'var(--gray-300)',
        'gray-400': 'var(--gray-400)',
        'gray-500': 'var(--gray-500)',
        'gray-600': 'var(--gray-600)',
        'gray-700': 'var(--gray-700)',
        'gray-800': 'var(--gray-800)',
        'gray-900': 'var(--gray-900)',
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
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
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
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
        extrabold: 'var(--font-weight-extrabold)',
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
        DEFAULT: 'var(--accent-primary)',
      },
      ringOffsetColor: {
        DEFAULT: 'var(--canvas-bg)',
      },
    },
  },
  plugins: [],
}

export default config
