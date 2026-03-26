# S01: Rollup ESM browser bundles for core and memory

**Goal:** Add rollup build pipelines to packages/core and packages/memory that produce browser-consumable ESM bundles, with side-effect registration preserved and no Node.js-only globals leaking into the output.
**Demo:** After this: After this: `npm run build:browser` produces two ESM bundles; a one-liner import in Node confirms the memory driver is registered and can store/retrieve a document.

## Tasks
- [x] **T01: Audited core and memory for browser compatibility — zero Node.js globals found; rollup installed** — 1. Install rollup as a root devDependency (npm install -D rollup).
2. Read packages/core/index.js and all files it imports — confirm no process/Buffer/require usage.
3. Read packages/memory/index.js and all files it imports — same check.
4. Note any conditional requires or dynamic imports that would break in a browser bundle.
  - Estimate: 15m
  - Files: package.json, packages/core/index.js, packages/memory/index.js
  - Verify: node -e "import('./packages/core/index.js').then(m => console.log(Object.keys(m)))"
- [x] **T02: Rollup configs written; both ESM bundles build clean with registerDriver side-effect preserved** — 1. Create packages/core/rollup.config.js: input=index.js, output={file:'dist/jsnosqlc-core.esm.js', format:'esm'}, treeshake:{moduleSideEffects:true}.
2. Create packages/memory/rollup.config.js: same pattern, externalise '@alt-javascript/jsnosqlc-core' (it will be bundled separately or imported by the page).
3. Add 'build:browser': 'rollup -c' to scripts in packages/core/package.json and packages/memory/package.json.
4. Add root-level 'build:browser' script that runs both workspace builds in sequence.
5. Update exports fields in both package.json files: add 'module' and 'browser' keys pointing at dist/.
  - Estimate: 25m
  - Files: packages/core/rollup.config.js, packages/memory/rollup.config.js, packages/core/package.json, packages/memory/package.json, package.json
  - Verify: npm run build:browser 2>&1 | tail -20
- [x] **T03: Bundles smoke-tested in Node ESM; 55 existing tests still pass** — 1. Run 'npm run build:browser' from the root.
2. Inspect the memory bundle for the DriverManager.registerDriver line — confirm it is not tree-shaken.
3. Smoke-test: node --input-type=module <<< "import './packages/memory/dist/jsnosqlc-memory.esm.js'; import {DriverManager} from './packages/core/dist/jsnosqlc-core.esm.js'; console.log(DriverManager.getDrivers().length)" — expect 1.
4. Run root npm test to confirm existing tests still pass.
  - Estimate: 20m
  - Files: packages/core/dist/jsnosqlc-core.esm.js, packages/memory/dist/jsnosqlc-memory.esm.js
  - Verify: node --input-type=module <<< "import './packages/memory/dist/jsnosqlc-memory.esm.js'; import {DriverManager} from './packages/core/dist/jsnosqlc-core.esm.js'; const d=DriverManager.getDrivers(); console.log('drivers:', d.length); if(d.length<1) process.exit(1);"
