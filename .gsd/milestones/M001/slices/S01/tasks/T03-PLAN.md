# T03: Compliance Suite Skeleton and Core Tests

**Slice:** S01
**Milestone:** M001

## Goal

Write the shared `driverCompliance.js` test suite that all driver packages will import and run, plus the remaining core unit tests (DriverManager). Run everything to green.

## Must-Haves

### Truths
- `packages/core/test/driverCompliance.js` exports a `runCompliance(clientFactory)` function
- Compliance suite covers: `store` + `get`, `delete`, `insert`, `update`, `find` with `eq`, `gt`, `lt`, `contains`, `in`, `exists`, compound `and` filter
- `packages/core/test/driverManager.spec.js` tests: register, deregister, getClient routes correctly, getClient throws on no match, clear resets registry
- `npm test` in `packages/core` runs all specs and exits 0 (filter + driverManager specs — compliance spec is not run standalone since it requires a driver)
- `packages/core` has no external runtime dependencies (dev deps only: mocha, chai)

### Artifacts
- `packages/core/test/driverCompliance.js` — exportable compliance test suite
- `packages/core/test/driverManager.spec.js` — DriverManager unit tests
- Updated `packages/core/package.json` — test script covers all `test/**/*.spec.js`

### Key Links
- `driverCompliance.js` imports `Collection`, `Cursor`, `Filter` from `@alt-javascript/jsnosqlc-core` (relative in core package, absolute in driver packages)
- Driver packages will: `import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js'`

## Steps

1. Write `packages/core/test/driverManager.spec.js` — stub driver class, test all DriverManager methods
2. Write `packages/core/test/driverCompliance.js`:
   - Export `runCompliance(clientFactory, options = {})` where `clientFactory` is `async () => Client`
   - Sections: key-value ops (store/get/delete), document ops (insert/update), find with each operator
   - Use `describe`/`it`/`before`/`after` from mocha (imported, not global)
   - Use `assert` from chai
3. Verify mocha picks up `test/**/*.spec.js` but NOT `driverCompliance.js` (it has no top-level describe)
4. Run `npm test` in `packages/core` — all pass
5. Commit the slice: `git add -A && git commit -m "feat(M001/S01): core interfaces, filter builder, compliance suite"`

## Context

- `driverCompliance.js` must use explicit mocha imports, not globals, because it's invoked from driver packages in different environments
- The compliance file should use `describe` and `it` as named exports from mocha for maximum portability
- `clientFactory` is a zero-arg async factory that returns a fresh Client for each test run. The suite calls `client.close()` in `after()`.
- Options object reserved for future use (e.g. `{ skipFind: true }` for backends without scan)
