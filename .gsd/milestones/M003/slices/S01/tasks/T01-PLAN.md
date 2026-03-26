---
estimated_steps: 4
estimated_files: 3
skills_used: []
---

# T01: Install rollup dev dependency and audit core/memory for browser compatibility

1. Install rollup as a root devDependency (npm install -D rollup).
2. Read packages/core/index.js and all files it imports — confirm no process/Buffer/require usage.
3. Read packages/memory/index.js and all files it imports — same check.
4. Note any conditional requires or dynamic imports that would break in a browser bundle.

## Inputs

- `packages/core/index.js`
- `packages/memory/index.js`
- `packages/core/package.json`
- `packages/memory/package.json`

## Expected Output

- `rollup installed in root node_modules`
- `audit notes on any Node-only globals (expected: none)`

## Verification

node -e "import('./packages/core/index.js').then(m => console.log(Object.keys(m)))"
