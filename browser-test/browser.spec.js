/**
 * browser.spec.js — Playwright integration test for jsnosqlc browser bundles.
 *
 * Starts a local static HTTP server rooted at the repo root, serves
 * browser-test/index.html, waits for all compliance operations to complete,
 * then asserts zero failures.
 *
 * Tests both the localStorage driver and the in-memory driver running in a
 * real Chrome browser context.
 */
import { test, expect } from '@playwright/test';
import { createServer } from 'http';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.map': 'application/json',
  '.json': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      try {
        // Serve a minimal favicon to prevent Chrome 404 console noise
        if (req.url === '/favicon.ico') {
          res.writeHead(204);
          res.end();
          return;
        }
        const filePath = path.join(ROOT, req.url.split('?')[0]);
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
          res.writeHead(404);
          res.end('directory listing not supported');
          return;
        }
        const ext = path.extname(filePath);
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(readFileSync(filePath));
      } catch (e) {
        res.writeHead(404);
        res.end('not found: ' + req.url);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

let server;
let port;

test.beforeAll(async () => {
  ({ server, port } = await startServer());
});

test.afterAll(async () => {
  server.close();
});

test('jsnosqlc browser bundles — localStorage and memory driver compliance', async ({ page }) => {
  // Collect console errors — exclude favicon 404 (cosmetic browser request, not our code)
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Chrome logs "Failed to load resource" for favicon.ico without a URL — exclude
      if (!text.includes('favicon')) {
        consoleErrors.push(text);
      }
    }
  });

  // Log 4xx responses for debugging
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log('HTTP error:', res.status(), res.url());
    }
  });

  // Collect page errors (uncaught exceptions)
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  await page.goto(`http://127.0.0.1:${port}/browser-test/index.html`);

  // Wait for the test harness to complete (title changes to "DONE: ...")
  await page.waitForFunction(
    () => document.title.startsWith('DONE:'),
    { timeout: 15000 }
  );

  // Read results from the page
  const results = await page.evaluate(() => window.__testResults);

  // Report individual failures for debugging
  if (results.failed > 0) {
    const failures = results.tests
      .filter(t => t.status === 'fail')
      .map(t => `${t.label}: ${t.error}`)
      .join('\n');
    console.error('Browser test failures:\n' + failures);
  }

  // Assert no console errors occurred
  expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);

  // Assert no page errors
  expect(pageErrors, `Page errors: ${pageErrors.join(', ')}`).toHaveLength(0);

  // Assert all tests passed
  expect(results.failed).toBe(0);
  expect(results.passed).toBeGreaterThan(0);
});
