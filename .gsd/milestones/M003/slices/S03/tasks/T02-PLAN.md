---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T02: Write browser test page

Create browser-test/index.html:
  - <script type='module'> imports jsnosqlc-localstorage.esm.js from a relative path
  - Runs compliance operations inline: store, get, insert, find (with filter), update, delete against localStorage and memory drivers
  - Renders pass/fail results as <li> elements with data-status='pass' or 'fail'
  - Sets window.__testResults = { passed, failed, tests: [...] } when complete
  - Sets document.title to 'DONE: N passed, M failed' when finished

The HTML page must be self-contained and work when served from browser-test/ by a local static HTTP server.

## Inputs

- `packages/localstorage/dist/jsnosqlc-localstorage.esm.js`
- `packages/memory/dist/jsnosqlc-memory.esm.js`

## Expected Output

- `browser-test/index.html`

## Verification

ls browser-test/index.html
