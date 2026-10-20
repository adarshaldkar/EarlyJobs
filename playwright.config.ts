import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const useLocalServers = !externalBaseURL;

/**
 * Use local Vite/Express servers by default. Set PLAYWRIGHT_BASE_URL and
 * PLAYWRIGHT_API_BASE_URL to run the same browser tests against a deployed
 * staging environment instead.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalBaseURL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: useLocalServers
    ? [
        {
          command: 'npm run dev:server',
          url: 'http://localhost:5000/api/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
          stdout: 'ignore',
          stderr: 'pipe'
        },
        {
          command: 'npm run dev:client',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
          stdout: 'ignore',
          stderr: 'pipe'
        }
      ]
    : undefined
});
