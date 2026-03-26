# M003: 

## Vision
Make jsnosqlc isomorphic: core and memory packages ship ESM bundles consumable in the browser via rollup; a new localstorage driver implements the full NoSQL interface over Web Storage (localStorage / sessionStorage). Code written against the jsnosqlc API runs unchanged in Node.js or the browser by swapping the registered driver.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Rollup ESM browser bundles for core and memory | medium | — | ✅ | After this: `npm run build:browser` produces two ESM bundles; a one-liner import in Node confirms the memory driver is registered and can store/retrieve a document. |
| S02 | LocalStorage and SessionStorage drivers | low | S01 | ✅ | After this: `npm test --workspace=packages/localstorage` passes the full compliance suite for both `jsnosqlc:localstorage:` and `jsnosqlc:sessionstorage:` using an injected in-memory mock — no browser required. |
| S03 | Browser integration test + README quick-start | low | S01, S02 | ✅ | After this: `npm run test:browser` launches Playwright, loads the ESM bundles in a real Chromium tab, runs get/store/insert/find/update/delete against localStorage and the memory driver, and all assertions are green. |
