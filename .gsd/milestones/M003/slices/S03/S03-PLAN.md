# S03: Browser integration test + README quick-start

**Goal:** Prove the bundles work end-to-end in a real browser: build the localstorage ESM bundle, serve a static HTML page via Playwright, run compliance operations against localStorage and the memory driver, assert all pass, and write the README browser quick-start section.
**Demo:** After this: After this: `npm run test:browser` launches Playwright, loads the ESM bundles in a real Chromium tab, runs get/store/insert/find/update/delete against localStorage and the memory driver, and all assertions are green.

## Tasks
- [x] **T01: localstorage ESM bundle built; dual-DriverManager issue diagnosed and fixed by vendoring MemoryFilterEvaluator** — Build the localstorage ESM bundle (follows S01 pattern). Verify: dist/jsnosqlc-localstorage.esm.js exists, contains registerDriver calls for both drivers, exports DriverManager.
  - Estimate: 15m
  - Files: packages/localstorage/dist/jsnosqlc-localstorage.esm.js
  - Verify: npm run build:browser --workspace=packages/localstorage 2>&1 && grep -c 'registerDriver' packages/localstorage/dist/jsnosqlc-localstorage.esm.js
- [x] **T02: Browser test page written: 20 inline compliance operations against localStorage and sessionStorage** — Create browser-test/index.html:
  - <script type='module'> imports jsnosqlc-localstorage.esm.js from a relative path
  - Runs compliance operations inline: store, get, insert, find (with filter), update, delete against localStorage and memory drivers
  - Renders pass/fail results as <li> elements with data-status='pass' or 'fail'
  - Sets window.__testResults = { passed, failed, tests: [...] } when complete
  - Sets document.title to 'DONE: N passed, M failed' when finished

The HTML page must be self-contained and work when served from browser-test/ by a local static HTTP server.
  - Estimate: 30m
  - Files: browser-test/index.html
  - Verify: ls browser-test/index.html
- [x] **T03: Playwright spec passes: 20/20 browser operations green in real Chrome (165ms)** — Install playwright (npm install -D playwright @playwright/test). Install Chromium browser. Write browser-test/browser.spec.js:
  - Uses Playwright's built-in static server or http-server to serve browser-test/
  - Navigates to the served index.html
  - Waits for document.title to contain 'DONE'
  - Reads window.__testResults
  - Asserts failed === 0 and passed > 0
  - Asserts no console errors

Add 'test:browser' script to root package.json: 'npx playwright test browser-test/browser.spec.js'
  - Estimate: 40m
  - Files: browser-test/browser.spec.js, playwright.config.js, package.json
  - Verify: npm run test:browser
- [x] **T04: README browser quick-start section written with localStorage, sessionStorage, memory, and isomorphic examples** — Add a 'Browser Quick-Start' section to README.md. The section should include:
  1. How to use the localstorage bundle via <script type='module'>
  2. A complete runnable snippet: connect via jsnosqlc:localstorage:, store, get, find
  3. How to use the memory bundle (for offline/test use in browser)
  4. One-line note on isomorphic usage (same code works in Node.js with injected MockStorage)

Keep it concise — the existing README style is reference-doc. A few code blocks and brief explanations, no essays.
  - Estimate: 20m
  - Files: README.md
  - Verify: grep -n 'Browser Quick-Start\|localstorage.esm\|script type' README.md | head -10
