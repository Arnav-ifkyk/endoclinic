// playwright.config.js — 390x844 mobile viewport E2E configuration
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  webServer: {
    command: process.env.CI ? 'python3 -m http.server 4173 --bind 127.0.0.1' : 'python -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
