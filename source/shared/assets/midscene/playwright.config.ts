import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: 0,
  workers: 1,
  outputDir: './test-results',
  reporter: [['list'], ['@midscene/web/playwright-reporter']],
  use: {
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.ONEOS_BROWSER_EXECUTABLE
      ? { executablePath: process.env.ONEOS_BROWSER_EXECUTABLE } : {},
  },
});
