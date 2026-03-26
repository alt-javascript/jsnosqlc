---
id: T03
parent: S01
milestone: M003
provides: []
requires: []
affects: []
key_files: ["packages/core/dist/jsnosqlc-core.esm.js", "packages/memory/dist/jsnosqlc-memory.esm.js"]
key_decisions: ["Browser usage pattern: import { DriverManager, Filter } from './jsnosqlc-memory.esm.js' — one import, full API; do not cross-import with standalone core bundle"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Smoke test printed 'drivers: 1 [MemoryDriver]', 'smoke test PASS'; npm test 55/55 pass"
completed_at: 2026-03-26T04:37:42.639Z
blocker_discovered: false
---

# T03: Bundles smoke-tested in Node ESM; 55 existing tests still pass

> Bundles smoke-tested in Node ESM; 55 existing tests still pass

## What Happened
---
id: T03
parent: S01
milestone: M003
key_files:
  - packages/core/dist/jsnosqlc-core.esm.js
  - packages/memory/dist/jsnosqlc-memory.esm.js
key_decisions:
  - Browser usage pattern: import { DriverManager, Filter } from './jsnosqlc-memory.esm.js' — one import, full API; do not cross-import with standalone core bundle
duration: ""
verification_result: passed
completed_at: 2026-03-26T04:37:42.639Z
blocker_discovered: false
---

# T03: Bundles smoke-tested in Node ESM; 55 existing tests still pass

**Bundles smoke-tested in Node ESM; 55 existing tests still pass**

## What Happened

Ran the full build and smoke-tested both bundles. Smoke test confirmed: 1 MemoryDriver registered, store/get/insert/find all working from the ESM bundle. Then ran root npm test \u2014 55 tests (31 core, 24 memory) all passing.

## Verification

Smoke test printed 'drivers: 1 [MemoryDriver]', 'smoke test PASS'; npm test 55/55 pass

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --input-type=module (smoke test)` | 0 | ✅ pass — drivers:1, store/get/insert/find confirmed | 2000ms |
| 2 | `npm test` | 0 | ✅ pass — 55 tests passing | 2100ms |


## Deviations

Smoke test uses the correct browser usage pattern (import DriverManager from the memory bundle, not a separate core import), which is the real isomorphic pattern.

## Known Issues

None.

## Files Created/Modified

- `packages/core/dist/jsnosqlc-core.esm.js`
- `packages/memory/dist/jsnosqlc-memory.esm.js`


## Deviations
Smoke test uses the correct browser usage pattern (import DriverManager from the memory bundle, not a separate core import), which is the real isomorphic pattern.

## Known Issues
None.
