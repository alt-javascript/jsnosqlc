# T01: Project Scaffold and Core Base Classes

**Slice:** S01
**Milestone:** M001

## Goal

Set up the monorepo root and `packages/core` package. Implement all base classes that form the interface contract: `Driver`, `Client`, `Collection`, `Cursor`, `DriverManager`, `UnsupportedOperationError`.

## Must-Haves

### Truths
- `packages/core/package.json` has `"type": "module"`, `"name": "@alt-javascript/jsnoslqc-core"`, mocha test script
- `packages/core/index.js` exports all public symbols
- `DriverManager.registerDriver()`, `getClient()`, `deregisterDriver()`, `clear()` work correctly
- `DriverManager.getClient()` throws `No suitable driver` when no driver accepts the URL
- `Collection` base class methods throw `UnsupportedOperationError` when called on the base (not implemented by driver)
- `Cursor` implements async iterator protocol (`[Symbol.asyncIterator]`)

### Artifacts
- `package.json` — root monorepo config with `workspaces`, `npm test` targeting core
- `packages/core/package.json` — ESM package with mocha dev dep
- `packages/core/index.js` — re-exports all public classes
- `packages/core/Driver.js` — base Driver class
- `packages/core/Client.js` — base Client class with `getCollection()`, `close()`, closed-guard
- `packages/core/Collection.js` — base Collection with `get`, `store`, `delete`, `find`, `insert`, `update` — all throw `UnsupportedOperationError`
- `packages/core/Cursor.js` — base Cursor with `next()`, `getDocument()`, `getDocuments()`, `close()`, asyncIterator
- `packages/core/DriverManager.js` — static registry, `getClient()` iterates drivers
- `packages/core/errors.js` — `UnsupportedOperationError` extending Error

### Key Links
- `DataSource.js` (jsdbc pattern) → `Client.js` (our equivalent)
- `DriverManager.getClient()` → `Driver.connect()` → returns `Client`

## Steps

1. Init git repo, create root `package.json` with workspaces pointing to `packages/*`
2. Create `packages/core/package.json` (ESM, mocha dev dep, test script)
3. Write `packages/core/errors.js` — `UnsupportedOperationError`
4. Write `packages/core/Driver.js` — `acceptsURL(url)`, `connect(url, props)`
5. Write `packages/core/DriverManager.js` — static registry, `registerDriver`, `deregisterDriver`, `getClient`, `getDrivers`, `clear`
6. Write `packages/core/Cursor.js` — base cursor with closed guard, asyncIterator
7. Write `packages/core/Collection.js` — base collection, all methods throw `UnsupportedOperationError`
8. Write `packages/core/Client.js` — base client, `getCollection(name)`, `close()`
9. Write `packages/core/index.js` — barrel export
10. Install dev dependencies in `packages/core`, verify `node --input-type=module` can import core

## Context

- Mirror jsdbc's pattern exactly: Driver base → driver impl registers on import → DriverManager routes by URL prefix
- `Client` is the NoSQL equivalent of jsdbc's `Connection`
- `Collection` is the equivalent of jsdbc's `Statement`/`PreparedStatement`
- `Cursor` is the equivalent of jsdbc's `ResultSet`
- All base class methods that drivers must implement should throw `UnsupportedOperationError`, not `Error('Not implemented')` — gives callers something to `instanceof`-check
- Key jsdbc file to reference for patterns: `/Users/craig/src/github/alt-javascript/jsdbc/packages/core/`
