# S02: In-Memory Driver

**Goal:** Ship a working `jsnosqlc:memory:` driver that passes the full compliance suite with zero external dependencies.
**Demo:** `npm test` in `packages/memory` runs the compliance suite — all find/store/get/delete/insert/update/find tests pass.

## Must-Haves

- `packages/memory/MemoryDriver.js` self-registers on import under `jsnosqlc:memory:` prefix
- `MemoryCollection` implements all 6 operations: get, store, delete, insert, update, find
- `find()` applies the full Filter AST — all 10 operators, compound `and`
- `insert()` generates a unique id (uuid or random hex) and returns it
- `update()` merges the patch without destroying other fields
- All compliance suite tests pass: `npm test` in `packages/memory` exits 0
- Zero external runtime dependencies (memory package only devDeps: mocha, chai)

## Tasks

- [ ] **T01: MemoryDriver, MemoryClient, MemoryCollection**
  Implement the driver, client, and collection. get/store/delete/insert/update backed by a Map.

- [ ] **T02: Filter evaluation engine and find()**
  Implement the in-memory filter evaluator that applies the Filter AST to stored documents.

- [ ] **T03: Compliance suite run and package wiring**
  Wire `packages/memory/test/compliance.spec.js` to run the imported compliance suite. Ensure `npm test` passes fully.

## Files Likely Touched

- `packages/memory/package.json`
- `packages/memory/index.js`
- `packages/memory/MemoryDriver.js`
- `packages/memory/MemoryClient.js`
- `packages/memory/MemoryCollection.js`
- `packages/memory/MemoryFilterEvaluator.js`
- `packages/memory/test/compliance.spec.js`
