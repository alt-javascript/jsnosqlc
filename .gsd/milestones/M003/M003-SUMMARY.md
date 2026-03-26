---
id: M003
title: "Browser Support — LocalStorage Driver + ESM Bundles"
status: complete
completed_at: 2026-03-26T04:54:08.472Z
key_decisions:
  - Memory bundle uses treeshake:false — the only reliable way to preserve DriverManager.registerDriver() side-effect through rollup when core is inlined
  - localstorage vendors MemoryFilterEvaluator.js locally rather than depending on the memory package — avoids dual-DriverManager instance in the browser bundle
  - Browser bundle pattern: treeshake:false + @rollup/plugin-node-resolve + no sourcemaps — avoids side-effect elision, workspace resolution, and browser 404 noise
  - Playwright spec uses inline Node.js http.createServer() rather than an external static server package — avoids extra dependency
  - file:// protocol rejected by Chrome for cross-directory ESM imports — HTTP server required for Playwright browser testing
  - MockStorage injection pattern: { storageBackend: new MockStorage() } passed to getClient() — enables isomorphic testing in Node.js without jsdom
key_files:
  - packages/core/rollup.config.js
  - packages/memory/rollup.config.js
  - packages/localstorage/rollup.config.js
  - packages/localstorage/LocalStorageDriver.js
  - packages/localstorage/LocalStorageCollection.js
  - packages/localstorage/LocalStorageClient.js
  - packages/localstorage/MockStorage.js
  - packages/localstorage/MemoryFilterEvaluator.js
  - packages/localstorage/test/compliance.spec.js
  - packages/memory/index.js
  - browser-test/index.html
  - browser-test/browser.spec.js
  - playwright.config.js
  - README.md
lessons_learned:
  - rollup treeshake drops module-level side-effect calls (registerDriver) when the called module is inlined and has no live exports — treeshake:false is the pragmatic fix for small bundles where correctness trumps minification
  - two separate ESM bundles that both inline core produce two DriverManager class instances — registering a driver in one makes it invisible to the other; avoid cross-bundle imports or use a single bundle as the authority
  - Chrome blocks cross-directory file:// ESM imports (CORS restriction) — always use HTTP for Playwright browser tests even in local development
  - Web Storage iteration requires the storage.length + storage.key(i) pattern; Map-backed MockStorage preserves insertion order which makes this correct
---

# M003: Browser Support — LocalStorage Driver + ESM Bundles

**jsnosqlc is now isomorphic: ESM bundles for core, memory, and localstorage; LocalStorage and SessionStorage drivers with 51 compliance tests and Playwright browser verification passing in real Chrome.**

## What Happened

M003 shipped in three slices. S01 added rollup build pipelines to core and memory, discovering that treeshake:false was necessary to preserve the DriverManager.registerDriver() side-effect. S02 built the complete localstorage package from scratch: MockStorage (Web Storage API mock), LocalStorageCollection (clientId:collection:docKey namespacing, JSON serialisation, MemoryFilterEvaluator for find()), LocalStorageClient (clientId generation), and both drivers — all in a single self-contained package with no external deps beyond core. 51 compliance tests (24 localStorage + 24 sessionStorage + 3 cross-client isolation) all pass. S03 built the Playwright browser integration test, working through two non-obvious issues: file:// CORS rejection by Chrome, and the localstorage→memory package dependency creating dual DriverManager instances. Both fixed. 20/20 in-browser operations confirmed green in real Chrome in 165ms. README updated with Browser Quick-Start section covering all four usage patterns.

## Success Criteria Results

All 9 success criteria met — see VALIDATION.md for checklist with evidence.

## Definition of Done Results

- **rollup build scripts added to packages/core and packages/memory; dist/ bundles produced** — ✅ npm run build:browser produces all 3 bundles clean in under 30ms each\n- **package.json exports fields for core and memory include module/browser entries** — ✅ both packages updated with browser/module/exports fields\n- **packages/localstorage exists with LocalStorageDriver, SessionStorageDriver, LocalStorageCollection, compliance tests** — ✅ all files present; 51 compliance tests written\n- **Compliance suite passes for localStorage and sessionStorage drivers (injected mock backend)** — ✅ 51/51 tests passing\n- **Playwright browser integration test passes against a local static server** — ✅ 1/1 Playwright test passing, 20/20 in-browser operations green\n- **Root npm test still passes (all Node.js unit tests)** — ✅ 106/106 tests passing across core, memory, localstorage\n- **README updated with browser quick-start section** — ✅ Browser Quick-Start section with localStorage, sessionStorage, memory, and isomorphic examples

## Requirement Outcomes

- **R-browser-1 (isomorphic storage access)**: VALIDATED — LocalStorageDriver and SessionStorageDriver implement the full NoSQL interface over Web Storage; same code runs in Node.js (with MockStorage injection) and browser (with globalThis.localStorage/sessionStorage)\n- **R-browser-2 (browser bundle delivery)**: VALIDATED — rollup ESM bundles for core, memory, and localstorage built clean; Playwright test loads and runs them in real Chrome\n- **R-browser-3 (test coverage)**: VALIDATED — 51 Node.js compliance tests + 20 Playwright in-browser operations + 3 cross-client isolation tests\n- **R-compat-1 (existing drivers unaffected)**: VALIDATED — npm test 106/106 passing; all M001 and M002 drivers unchanged

## Deviations

None.

## Follow-ups

None.
