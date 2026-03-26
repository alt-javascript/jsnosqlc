---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T04: Write README browser quick-start

Add a 'Browser Quick-Start' section to README.md. The section should include:
  1. How to use the localstorage bundle via <script type='module'>
  2. A complete runnable snippet: connect via jsnosqlc:localstorage:, store, get, find
  3. How to use the memory bundle (for offline/test use in browser)
  4. One-line note on isomorphic usage (same code works in Node.js with injected MockStorage)

Keep it concise — the existing README style is reference-doc. A few code blocks and brief explanations, no essays.

## Inputs

- `README.md`
- `packages/localstorage/index.js`
- `packages/memory/dist/jsnosqlc-memory.esm.js`

## Expected Output

- `README.md (updated)`

## Verification

grep -n 'Browser Quick-Start\|localstorage.esm\|script type' README.md | head -10
