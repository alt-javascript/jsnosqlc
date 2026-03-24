# S01: Core Interfaces and Filter Builder

**Goal:** Establish the complete interface contract and filter builder that all drivers depend on.
**Demo:** Import `@alt-javascript/jsnosqlc-core`, build a filter with the chainable API, inspect its AST, and run the compliance suite skeleton — all with zero external dependencies.

## Must-Haves

- `Driver`, `Client`, `Collection`, `Cursor`, `DriverManager`, `Filter`, `UnsupportedOperationError` all export from `packages/core/index.js`
- Filter builder: `Filter.where('age').gt(18).and('name').eq('Alice').build()` returns a valid AST
- All 10 operators implemented: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`, `exists`
- `driverCompliance.js` exports a runnable mocha suite that a driver package can call passing a connected client factory
- `packages/core` tests pass: `npm test` in `packages/core` exits 0

## Tasks

- [ ] **T01: Project scaffold and core base classes**
  Set up monorepo root, `packages/core` package, and implement `Driver`, `Client`, `Collection`, `Cursor`, `DriverManager`, `UnsupportedOperationError` base classes.

- [ ] **T02: Filter builder and AST**
  Implement `Filter.where()` chainable builder, `FieldCondition` with all 10 operators, and the AST node types. Unit-test the builder independently.

- [ ] **T03: Compliance suite skeleton and core tests**
  Write `driverCompliance.js` shared test module covering all Collection operations + filter operators. Write core-package unit tests. Run everything to green.

## Files Likely Touched

- `package.json` (root)
- `packages/core/package.json`
- `packages/core/index.js`
- `packages/core/Driver.js`
- `packages/core/Client.js`
- `packages/core/Collection.js`
- `packages/core/Cursor.js`
- `packages/core/DriverManager.js`
- `packages/core/Filter.js`
- `packages/core/FieldCondition.js`
- `packages/core/errors.js`
- `packages/core/test/filter.spec.js`
- `packages/core/test/driverManager.spec.js`
- `packages/core/test/driverCompliance.js`
