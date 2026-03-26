---
id: S01
parent: M003
milestone: M003
provides:
  - packages/core/dist/jsnosqlc-core.esm.js — standalone core bundle
  - packages/memory/dist/jsnosqlc-memory.esm.js — memory+core bundle for browser use
  - build:browser npm script at root and workspace level
  - Established rollup config pattern for subsequent driver packages
requires:
  []
affects:
  - S02
  - S03
key_files:
  - packages/core/rollup.config.js
  - packages/memory/rollup.config.js
  - packages/core/package.json
  - packages/memory/package.json
  - packages/memory/index.js
  - packages/memory/dist/jsnosqlc-memory.esm.js
  - packages/core/dist/jsnosqlc-core.esm.js
key_decisions:
  - Memory bundle inlines core with treeshake:false — avoids import map requirement and ensures registerDriver side-effect is preserved
  - memory/index.js re-exports all core symbols — one import for the full API
  - Browser usage pattern: import { DriverManager, Filter } from './jsnosqlc-memory.esm.js'
patterns_established:
  - Browser bundle pattern: memory bundle inlines core with treeshake:false; localstorage bundle will follow same pattern
  - Single-import isomorphic API: import { DriverManager, Filter } from jsnosqlc-memory.esm.js covers all needed symbols
observability_surfaces:
  - rollup build output shows chunk sizes and any unresolved deps as warnings
  - DriverManager.registerDriver() confirmed present in bundle at line 753
drill_down_paths:
  - .gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T04:38:10.629Z
blocker_discovered: false
---

# S01: Rollup ESM browser bundles for core and memory

**Rollup ESM bundles for core and memory built and verified; memory driver auto-registers correctly from the bundle**

## What Happened

Installed rollup and @rollup/plugin-node-resolve. Wrote rollup configs for core and memory. Core bundles cleanly with no external deps. Memory bundle required treeshake:false to preserve the DriverManager.registerDriver() auto-registration side-effect (rollup elided it under all other treeshake options). Updated memory/index.js to re-export all core symbols. Both bundles build in under 30ms with no warnings. Smoke test confirmed full API works from a single ESM import. All 55 existing tests still pass.

## Verification

Build: no warnings; bundle grep: registerDriver on line 753; smoke test: PASS; npm test: 55/55

## Requirements Advanced

- R-browser-2 — ESM bundles produced and verified working in Node ESM context as browser proxy

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Memory bundle uses treeshake:false after confirming that both moduleSideEffects:true and annotations:false still elided the registerDriver() side-effect. Acceptable \u2014 bundle is 750 lines, correctness is non-negotiable. memory/index.js updated to re-export all core symbols so the single bundle is a complete standalone API.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `packages/core/rollup.config.js` — Rollup config for core ESM bundle
- `packages/memory/rollup.config.js` — Rollup config for memory ESM bundle (treeshake:false, node-resolve plugin)
- `packages/core/package.json` — Added build:browser script, module/browser export fields, @rollup/plugin-node-resolve devDep
- `packages/memory/package.json` — Added build:browser script, module/browser/sideEffects fields, @rollup/plugin-node-resolve devDep; re-exports core API
- `packages/memory/index.js` — Re-exports full core API (DriverManager, Filter, etc) for single-import browser usage
- `package.json` — Added root build:browser script
- `packages/core/dist/jsnosqlc-core.esm.js` — Generated core ESM bundle
- `packages/memory/dist/jsnosqlc-memory.esm.js` — Generated memory ESM bundle (includes inlined core)
