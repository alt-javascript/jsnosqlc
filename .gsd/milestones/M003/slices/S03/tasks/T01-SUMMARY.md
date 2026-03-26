---
id: T01
parent: S03
milestone: M003
provides: []
requires: []
affects: []
key_files: ["packages/localstorage/dist/jsnosqlc-localstorage.esm.js", "packages/localstorage/MemoryFilterEvaluator.js"]
key_decisions: ["localstorage package vendors MemoryFilterEvaluator.js locally — removing the memory dep eliminates dual-DriverManager problem in the browser bundle", "Rollup bundles have no sourcemaps — avoids browser 404 console noise"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm run build:browser: clean, no warnings; grep -c registerDriver: 7 occurrences (correct)"
completed_at: 2026-03-26T04:52:15.823Z
blocker_discovered: false
---

# T01: localstorage ESM bundle built; dual-DriverManager issue diagnosed and fixed by vendoring MemoryFilterEvaluator

> localstorage ESM bundle built; dual-DriverManager issue diagnosed and fixed by vendoring MemoryFilterEvaluator

## What Happened
---
id: T01
parent: S03
milestone: M003
key_files:
  - packages/localstorage/dist/jsnosqlc-localstorage.esm.js
  - packages/localstorage/MemoryFilterEvaluator.js
key_decisions:
  - localstorage package vendors MemoryFilterEvaluator.js locally — removing the memory dep eliminates dual-DriverManager problem in the browser bundle
  - Rollup bundles have no sourcemaps — avoids browser 404 console noise
duration: ""
verification_result: passed
completed_at: 2026-03-26T04:52:15.823Z
blocker_discovered: false
---

# T01: localstorage ESM bundle built; dual-DriverManager issue diagnosed and fixed by vendoring MemoryFilterEvaluator

**localstorage ESM bundle built; dual-DriverManager issue diagnosed and fixed by vendoring MemoryFilterEvaluator**

## What Happened

Built localstorage ESM bundle. Found dual-DriverManager issue when localstorage depended on memory package (rollup resolved two separate instances). Fixed by vendoring MemoryFilterEvaluator.js directly and removing memory dependency. Rebuilt cleanly. Verified registerDriver calls for both localStorage and sessionStorage drivers are present in the single bundle.

## Verification

npm run build:browser: clean, no warnings; grep -c registerDriver: 7 occurrences (correct)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build:browser --workspace=packages/localstorage` | 0 | ✅ pass — no warnings | 2300ms |


## Deviations

Removed sourcemaps from rollup bundles to avoid browser 404 noise. Discovered that localstorage package initially had a dependency on memory package, causing two DriverManager instances in the bundle \u2014 resolved by vendoring MemoryFilterEvaluator.js directly into localstorage and removing the memory dependency.

## Known Issues

None.

## Files Created/Modified

- `packages/localstorage/dist/jsnosqlc-localstorage.esm.js`
- `packages/localstorage/MemoryFilterEvaluator.js`


## Deviations
Removed sourcemaps from rollup bundles to avoid browser 404 noise. Discovered that localstorage package initially had a dependency on memory package, causing two DriverManager instances in the bundle \u2014 resolved by vendoring MemoryFilterEvaluator.js directly into localstorage and removing the memory dependency.

## Known Issues
None.
