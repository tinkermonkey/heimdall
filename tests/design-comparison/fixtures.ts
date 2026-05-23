import { Page } from '@playwright/test'

export interface ComparisonFixture {
  /**
   * Unique ID used for snapshot filenames:
   *   {id}-design.png  — captured from design-reference HTML
   *   {id}-react.png   — captured from React test harness
   */
  id: string
  /** Human-readable name used in test.describe labels */
  label: string
  /** Canvas theme used by the design reference. React harness is configured to match. */
  theme: 'light' | 'dark'
  design: {
    /** Filename within design-reference/preview/ */
    file: string
    /** Element to clip. Defaults to '.card' (the standard preview wrapper). */
    selector?: string
    /**
     * Optional async actions to run after page load — e.g. injecting CSS to
     * normalise a broken layout in the static design reference HTML.
     */
    setup?: (page: Page) => Promise<void>
  }
  react: {
    /** Value of the ?example= query param for the test harness */
    exampleId: string
    /** CSS selector for the element to clip from the React page */
    selector: string
    /**
     * Optional async actions to run after page load — e.g. clicking a button
     * to open a modal before the screenshot is taken.
     */
    setup?: (page: Page) => Promise<void>
  }
}

export const FIXTURES: ComparisonFixture[] = [
  {
    id: 'quick-access-tile',
    label: 'QuickAccessTile',
    theme: 'light',
    // Design HTML shows a 2-tile grid; clip to the first tile only so it matches
    // the single-tile React capture.
    design: { file: 'component-quick-access-tile.html', selector: '.card > div:first-child > div:first-child' },
    react: {
      exampleId: 'page-patterns',
      selector: '[data-testid="quick-access-tile"]',
    },
  },
  {
    id: 'inspector-panel',
    label: 'InspectorPanel',
    theme: 'light',
    design: { file: 'component-inspector-panel.html' },
    react: {
      exampleId: 'inspector-panel',
      selector: '[class*="inspector-panel"]:not([class*="inspector-panel__"])',
    },
  },
  {
    id: 'kv-grid',
    label: 'KVGrid',
    theme: 'light',
    // Design HTML wraps the kv-grid in a plain div (no class); clip to that div
    // so the annotation paragraph is excluded.
    design: { file: 'component-kv-grid.html', selector: '.card > div:first-child' },
    react: {
      exampleId: 'inspector-panel',
      selector: '[class*="kv-grid"]',
    },
  },
  {
    id: 'workspace-switcher',
    label: 'WorkspaceSwitcherDialog',
    theme: 'dark',
    // Design reference shows the dialog on a dark shell card; clip to the
    // inner dialog box (first child of .card) to match what .modal captures.
    design: { file: 'component-workspace-switcher.html', selector: '.card > div' },
    react: {
      exampleId: 'overlays',
      selector: '.modal',
      setup: async (page) => {
        await page.locator('text=Open Workspace Switcher').click()
        await page.locator('[class*="workspace-switcher-dialog__content"]').waitFor({ state: 'visible' })
      },
    },
  },
  {
    id: 'filter-dropdown',
    label: 'FilterDropdown',
    theme: 'light',
    // Design HTML shows both closed and open states side-by-side in a .row.
    // Clip to just the closed trigger (first child of .row) so both sides show
    // the same closed state. React panel is position:absolute so the outer div
    // matches the trigger size regardless of open/closed.
    design: { file: 'component-filter-dropdown.html', selector: '.card .row > div:first-child' },
    react: {
      exampleId: 'filter-dropdown',
      selector: '[class*="filter-dropdown"]',
    },
  },
  {
    id: 'version-pill',
    label: 'VersionPill',
    theme: 'light',
    // Design HTML shows multiple pills in a .row; clip to the first pill only so
    // it matches the single-element React capture.
    design: { file: 'component-version-pill.html', selector: '.card > .row:first-child > span:first-child' },
    react: {
      exampleId: 'primitives',
      selector: '[class*="version-pill"]',
    },
  },
  {
    id: 'activity-item',
    label: 'ActivityTimeline',
    theme: 'light',
    design: { file: 'component-activity-item.html' },
    react: {
      exampleId: 'page-patterns',
      selector: '[class*="activity-timeline"]',
    },
  },
  {
    id: 'config-tile',
    label: 'ConfigTile',
    theme: 'light',
    design: { file: 'component-config-tile.html' },
    react: {
      exampleId: 'page-patterns',
      selector: '[class*="config-tile"]',
    },
  },
  {
    id: 'hierarchy-row',
    label: 'HierarchyRow',
    theme: 'light',
    // Design HTML shows a multi-row tree; clip to just the first row so it matches
    // the single HierarchyRow captured on the React side.
    design: { file: 'component-hierarchy-row.html', selector: '.card > div:first-child > div:first-child' },
    react: {
      exampleId: 'hierarchy-tree',
      selector: '[class*="hierarchy-row"]',
    },
  },
  {
    id: 'statusbar',
    label: 'Statusbar',
    theme: 'dark',
    // Design HTML uses inline styles only; the bar is the first div child of .card
    // (after the <style> block). Use :first-of-type to skip the <style> element.
    // The inline-flex item spans lack white-space:nowrap so text wraps at the
    // space character when rendered at 11.5px — inject it to match production intent.
    design: {
      file: 'component-statusbar.html',
      selector: '.card > div:first-of-type',
      setup: async (page) => {
        await page.addStyleTag({ content: '* { white-space: nowrap !important; }' })
      },
    },
    react: {
      exampleId: 'shell-framework',
      selector: '[class*="statusbar"]',
    },
  },
  {
    id: 'tabs',
    label: 'TabBar',
    theme: 'light',
    design: { file: 'component-tabs.html' },
    react: {
      exampleId: 'tab-bar',
      selector: '[data-testid="tab-bar-card"]',
    },
  },

  // ── Chart components ────────────────────────────────────────────────────────
  {
    id: 'chart-sparkline',
    label: 'Chart · Sparkline',
    theme: 'light',
    design: { file: 'component-chart-sparkline.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="sparkline-emerald"]',
    },
  },
  {
    id: 'chart-linechart',
    label: 'Chart · LineChart standard',
    theme: 'light',
    design: { file: 'component-chart-linechart.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="linechart-standard"]',
    },
  },
  {
    id: 'chart-barv',
    label: 'Chart · BarV standard',
    theme: 'light',
    design: { file: 'component-chart-barv.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="barv-standard"]',
    },
  },
  {
    id: 'chart-barh',
    label: 'Chart · BarH standard',
    theme: 'light',
    design: { file: 'component-chart-barh.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="barh-standard"]',
    },
  },
  {
    id: 'chart-stackedbar',
    label: 'Chart · StackedBar standard',
    theme: 'light',
    design: { file: 'component-chart-stackedbar.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="stackedbar-standard"]',
    },
  },
  {
    id: 'chart-donut',
    label: 'Chart · Donut standard',
    theme: 'light',
    design: { file: 'component-chart-donut.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="donut-standard"]',
    },
  },
  {
    id: 'chart-heatmap',
    label: 'Chart · Heatmap standard',
    theme: 'light',
    design: { file: 'component-chart-heatmap.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="heatmap-standard"]',
    },
  },
  {
    id: 'chart-timeline',
    label: 'Chart · StatusTimeline standard',
    theme: 'light',
    design: { file: 'component-chart-timeline.html', selector: '.card svg' },
    react: {
      exampleId: 'charts',
      selector: 'svg[data-testid="timeline-standard"]',
    },
  },
]
