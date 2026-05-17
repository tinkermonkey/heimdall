import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI
const useDocker = !!process.env.PLAYWRIGHT_DOCKER

export default defineConfig({
  testDir: './tests',
  outputDir: isCI ? '/tmp/test-results' : './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['line'], ['html', { outputFolder: '/tmp/playwright-report' }]] : 'html',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: isCI ? 'bash scripts/ci-dev-server.sh' : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 1,
      },
    },
  ],

  // Docker/Container configuration for OS-level rendering consistency (ADR-005)
  // Enable with: PLAYWRIGHT_DOCKER=1 npm test
  // When enabled, runs the dev server in Docker for consistent asset serving; the browser runs on the host
  ...(useDocker && {
    webServer: {
      command: 'docker run --rm -p 5173:5173 -v $(pwd):/workspace -w /workspace node:18 bash -c "npm install && npm run dev"',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120000,
      env: { SHELL: '/bin/bash' },
    },
  }),
})
