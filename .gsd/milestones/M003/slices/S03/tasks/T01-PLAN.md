---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Build localstorage ESM bundle

Build the localstorage ESM bundle (follows S01 pattern). Verify: dist/jsnosqlc-localstorage.esm.js exists, contains registerDriver calls for both drivers, exports DriverManager.

## Inputs

- `packages/localstorage/rollup.config.js`
- `packages/localstorage/index.js`

## Expected Output

- `packages/localstorage/dist/jsnosqlc-localstorage.esm.js`

## Verification

npm run build:browser --workspace=packages/localstorage 2>&1 && grep -c 'registerDriver' packages/localstorage/dist/jsnosqlc-localstorage.esm.js
