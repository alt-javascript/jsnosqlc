---
estimated_steps: 8
estimated_files: 3
skills_used: []
---

# T03: Write and run Playwright browser spec

Install playwright (npm install -D playwright @playwright/test). Install Chromium browser. Write browser-test/browser.spec.js:
  - Uses Playwright's built-in static server or http-server to serve browser-test/
  - Navigates to the served index.html
  - Waits for document.title to contain 'DONE'
  - Reads window.__testResults
  - Asserts failed === 0 and passed > 0
  - Asserts no console errors

Add 'test:browser' script to root package.json: 'npx playwright test browser-test/browser.spec.js'

## Inputs

- `browser-test/index.html`

## Expected Output

- `browser-test/browser.spec.js`
- `playwright.config.js`

## Verification

npm run test:browser
