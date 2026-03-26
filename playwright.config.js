/**
 * playwright.config.js — Configuration for jsnosqlc browser integration tests.
 *
 * Uses the locally installed Google Chrome instead of downloading Playwright's
 * bundled Chromium, avoiding browser download requirements in this environment.
 */
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './browser-test',
  timeout: 30000,
  use: {
    channel: 'chrome',
    headless: true,
  },
  projects: [
    {
      name: 'chrome',
      use: { channel: 'chrome' },
    },
  ],
});
