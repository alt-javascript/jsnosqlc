---
id: T02
parent: S01
milestone: M003
provides: []
requires: []
affects: []
key_files: ["packages/core/rollup.config.js", "packages/memory/rollup.config.js", "packages/core/package.json", "packages/memory/package.json", "packages/memory/index.js", "package.json"]
key_decisions: ["Memory bundle inlines core (treeshake:false) rather than externalising it — avoids import map requirement in browser quick-starts", "memory/index.js re-exports all core API symbols so one import covers the full interface", "treeshake:false on memory bundle after confirming that moduleSideEffects:true and annotations:false both still elided registerDriver() — correctness over bundle size for a 750-line bundle"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm run build:browser produced both bundles without warnings; grep confirmed DriverManager.registerDriver(_driver) on line 753 of memory bundle"
completed_at: 2026-03-26T04:37:31.466Z
blocker_discovered: false
---

# T02: Rollup configs written; both ESM bundles build clean with registerDriver side-effect preserved

> Rollup configs written; both ESM bundles build clean with registerDriver side-effect preserved

## What Happened
---
id: T02
parent: S01
milestone: M003
key_files:
  - packages/core/rollup.config.js
  - packages/memory/rollup.config.js
  - packages/core/package.json
  - packages/memory/package.json
  - packages/memory/index.js
  - package.json
key_decisions:
  - Memory bundle inlines core (treeshake:false) rather than externalising it — avoids import map requirement in browser quick-starts
  - memory/index.js re-exports all core API symbols so one import covers the full interface
  - treeshake:false on memory bundle after confirming that moduleSideEffects:true and annotations:false both still elided registerDriver() — correctness over bundle size for a 750-line bundle
duration: ""
verification_result: passed
completed_at: 2026-03-26T04:37:31.467Z
blocker_discovered: false
---

# T02: Rollup configs written; both ESM bundles build clean with registerDriver side-effect preserved

**Rollup configs written; both ESM bundles build clean with registerDriver side-effect preserved**

## What Happened

Wrote rollup.config.js for core and memory. Core uses node-resolve plugin. Memory uses node-resolve with treeshake:false to preserve the DriverManager.registerDriver() auto-registration side effect (rollup was eliding it under all treeshake options). Added build:browser scripts to both packages and root. Updated package.json exports fields with browser/module entries. Updated memory/index.js to re-export all core symbols alongside memory-specific classes so the bundle is a complete standalone API.

## Verification

npm run build:browser produced both bundles without warnings; grep confirmed DriverManager.registerDriver(_driver) on line 753 of memory bundle

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build:browser` | 0 | ✅ pass | 2200ms |
| 2 | `grep -n 'registerDriver(_driver' packages/memory/dist/jsnosqlc-memory.esm.js` | 0 | ✅ pass — line 753 | 50ms |


## Deviations

Added @rollup/plugin-node-resolve to resolve workspace symlinks for the memory bundle. Memory index.js updated to re-export all core exports so a single bundle import gives users the full API (DriverManager, Filter, etc). Memory bundle uses treeshake:false to guarantee the DriverManager.registerDriver() side-effect is preserved.

## Known Issues

None.

## Files Created/Modified

- `packages/core/rollup.config.js`
- `packages/memory/rollup.config.js`
- `packages/core/package.json`
- `packages/memory/package.json`
- `packages/memory/index.js`
- `package.json`


## Deviations
Added @rollup/plugin-node-resolve to resolve workspace symlinks for the memory bundle. Memory index.js updated to re-export all core exports so a single bundle import gives users the full API (DriverManager, Filter, etc). Memory bundle uses treeshake:false to guarantee the DriverManager.registerDriver() side-effect is preserved.

## Known Issues
None.
