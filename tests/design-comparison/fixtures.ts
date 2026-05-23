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
    design: { file: 'component-quick-access-tile.html' },
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
    design: { file: 'component-kv-grid.html' },
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
    design: { file: 'component-filter-dropdown.html' },
    react: {
      exampleId: 'filter-dropdown',
      selector: '[class*="filter-dropdown"]',
    },
  },
  {
    id: 'version-pill',
    label: 'VersionPill',
    theme: 'light',
    design: { file: 'component-version-pill.html' },
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
    design: { file: 'component-hierarchy-row.html' },
    react: {
      exampleId: 'hierarchy-tree',
      selector: '[class*="hierarchy-row"]',
    },
  },
  {
    id: 'statusbar',
    label: 'Statusbar',
    theme: 'dark',
    design: { file: 'component-statusbar.html' },
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
      exampleId: 'shell-framework',
      selector: '[class*="tab-bar"]',
    },
  },
]
