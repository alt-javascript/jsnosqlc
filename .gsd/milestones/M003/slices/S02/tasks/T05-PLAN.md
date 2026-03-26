---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T05: Write compliance tests and run them

Write packages/localstorage/test/compliance.spec.js.

Two describe blocks: 'localStorage driver compliance' and 'sessionStorage driver compliance'.

Each block:
  1. Imports runCompliance from @alt-javascript/jsnosqlc-core/test/driverCompliance.js
  2. Creates a MockStorage instance
  3. Calls runCompliance(() => DriverManager.getClient('jsnosqlc:localstorage:', { storageBackend: mockStorage }))
  (or sessionstorage URL for the second block)
  4. Adds a cross-contamination test: two clients with the same MockStorage, different clientIds, store overlapping keys — confirm no bleed.

Then run npm test and confirm all compliance tests pass.

## Inputs

- `packages/core/test/driverCompliance.js`
- `packages/memory/test/compliance.spec.js`
- `packages/localstorage/MockStorage.js`

## Expected Output

- `packages/localstorage/test/compliance.spec.js`

## Verification

npm test --workspace=packages/localstorage
