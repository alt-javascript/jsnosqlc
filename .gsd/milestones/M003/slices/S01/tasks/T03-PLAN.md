---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T03: Run builds and smoke-test the bundles

1. Run 'npm run build:browser' from the root.
2. Inspect the memory bundle for the DriverManager.registerDriver line — confirm it is not tree-shaken.
3. Smoke-test: node --input-type=module <<< "import './packages/memory/dist/jsnosqlc-memory.esm.js'; import {DriverManager} from './packages/core/dist/jsnosqlc-core.esm.js'; console.log(DriverManager.getDrivers().length)" — expect 1.
4. Run root npm test to confirm existing tests still pass.

## Inputs

- `packages/core/dist/jsnosqlc-core.esm.js`
- `packages/memory/dist/jsnosqlc-memory.esm.js`

## Expected Output

- `smoke import prints 'drivers: 1'`
- `npm test passes`

## Verification

node --input-type=module <<< "import './packages/memory/dist/jsnosqlc-memory.esm.js'; import {DriverManager} from './packages/core/dist/jsnosqlc-core.esm.js'; const d=DriverManager.getDrivers(); console.log('drivers:', d.length); if(d.length<1) process.exit(1);"
