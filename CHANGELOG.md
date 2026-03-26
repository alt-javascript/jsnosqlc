# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning: [Semantic Versioning](https://semver.org/).

---

## [1.1.1] — 2026-03-26

### Changed

- Bumped all nine driver packages (`core`, `memory`, `localstorage`, `mongodb`, `dynamodb`,
  `firestore`, `cosmosdb`, `redis`, `cassandra`) to **1.1.1** — aligns the version across
  the entire monorepo following the browser-support release (1.1.0 was only applied to the
  three new/updated packages; the six server-side driver packages were inadvertently left at
  1.0.1)
- Updated `package-lock.json` to reflect the unified version

### Notes

- `npm audit` reports 5 dev-dependency vulnerabilities (3 low, 2 high) in `mocha` and
  transitive dependencies. These affect the test runner only — no published package exposes
  them at runtime. A mocha upgrade will be addressed in a future maintenance release.

---

## [1.1.0] — 2026-03-26

### Added

**LocalStorage driver (`@alt-javascript/jsnosqlc-localstorage`)** — new package

- `LocalStorageDriver` — registers `jsnosqlc:localstorage:`, connects to `globalThis.localStorage`
  or an injected `storageBackend` property
- `SessionStorageDriver` — registers `jsnosqlc:sessionstorage:`, connects to `globalThis.sessionStorage`
  or an injected `storageBackend` property
- `LocalStorageClient` — generates a unique `clientId` per connection to namespace all storage keys
- `LocalStorageCollection` — full six-operation implementation over Web Storage with key scheme
  `<clientId>:<collectionName>:<docKey>`; `find()` applies `MemoryFilterEvaluator` over all
  collection keys
- `MockStorage` — in-process Web Storage API implementation (`getItem`, `setItem`, `removeItem`,
  `clear`, `length`, `key`) for isomorphic testing in Node.js without a browser or jsdom
- Full compliance suite (51 tests): 24 localStorage + 24 sessionStorage + 3 cross-client
  isolation tests — all passing with injected `MockStorage`

**ESM browser bundles**

- `packages/core/dist/jsnosqlc-core.esm.js` — standalone core bundle
- `packages/memory/dist/jsnosqlc-memory.esm.js` — memory driver bundle with core inlined;
  re-exports `DriverManager`, `Filter`, and all core symbols for single-import browser usage
- `packages/localstorage/dist/jsnosqlc-localstorage.esm.js` — localStorage driver bundle with
  core inlined; both `LocalStorageDriver` and `SessionStorageDriver` auto-register on import
- `npm run build:browser` — root-level script builds all three bundles via rollup

**Browser integration test**

- `browser-test/index.html` — inline compliance harness (20 operations against localStorage
  and sessionStorage) loadable via a local HTTP server
- `browser-test/browser.spec.js` — Playwright spec; starts an inline Node.js HTTP server,
  loads the test page in Chrome, asserts zero failures; passes in ~165 ms
- `npm run test:browser` — runs the Playwright spec against installed Chrome

**Documentation**

- `packages/localstorage/README.md` — package README with browser and Node.js usage, key
  namespacing explanation, performance note, and `MockStorage` reference
- `docs/getting-started.md` — new Step 6: browser `localStorage` usage with `<script type="module">`
- `docs/api-reference.md` — new LocalStorage Driver and MockStorage sections; URL scheme table
  updated to include `jsnosqlc:localstorage:` and `jsnosqlc:sessionstorage:`
- `README.md` — Browser Quick-Start section with localStorage, sessionStorage, in-memory browser,
  and isomorphic Node.js examples; packages table updated; contributing commands updated

### Changed

- `packages/memory/index.js` — re-exports all core symbols (`DriverManager`, `Filter`,
  `Client`, `Collection`, `Cursor`, etc.) so the memory ESM bundle is a complete standalone
  browser API with a single import
- `packages/core/package.json`, `packages/memory/package.json` — added `module` and `browser`
  fields pointing at `dist/` bundles; added `build:browser` script
- Root `package.json` — added `build:browser` and `test:browser` scripts; `test` script now
  includes `packages/localstorage`

### Technical notes

- rollup bundles use `treeshake: false` to guarantee `DriverManager.registerDriver()` side-effects
  are not elided when core is inlined; this is intentional and correct for bundles of this size
- `packages/localstorage` vendors `MemoryFilterEvaluator.js` locally rather than depending on
  `@alt-javascript/jsnosqlc-memory`, avoiding a dual-`DriverManager` instance in the browser
  bundle

---

## [1.0.1] — 2026-03-24

### Fixed

- Corrected project name typo throughout: `jsnoslqc` → `jsnosqlc` in all source comments,
  JSDoc, test strings, default values, CI workflows, GSD milestone files, and documentation
- `repository.url` in all `package.json` files now matches the GitHub repository name (`jsnosqlc`)
  — required for npm provenance validation
- Regenerated `package-lock.json` against correct package names

---

## [1.0.0] — 2026-03-24

Initial public release of all packages.

### Added

**Core (`@alt-javascript/jsnosqlc-core`)**
- `Driver` — abstract base class for all jsnosqlc drivers
- `Client` — session abstraction with collection cache and lifecycle management
- `Collection` — six-operation interface: `get`, `store`, `delete`, `insert`, `update`, `find`
- `Cursor` — buffered result with cursor iteration, bulk access, and `for await...of` support
- `Filter` — chainable builder producing a backend-neutral AST
- `FieldCondition` — fluent operator methods: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`, `exists`
- `Filter.or(...filters)` — OR compound of built filter ASTs
- `filter.not()` — NOT negation of a filter
- `DriverManager` — static driver registry with URL-based dispatch
- `ClientDataSource` — `DataSource`-style convenience factory
- `UnsupportedOperationError` — thrown when a driver does not support an operation
- Shared compliance test suite (`test/driverCompliance.js`) — 25 tests for any driver

**In-memory driver (`@alt-javascript/jsnosqlc-memory`)**
- `MemoryDriver`, `MemoryClient`, `MemoryCollection` — zero-dependency in-memory implementation
- `MemoryFilterEvaluator` — in-memory filter evaluation for all 10 operators + `or`/`not`
- URL: `jsnosqlc:memory:`

**MongoDB driver (`@alt-javascript/jsnosqlc-mongodb`)**
- `MongoDriver`, `MongoClient`, `MongoCollection`, `MongoFilterTranslator`
- Full compliance suite passing against MongoDB 7
- URL: `jsnosqlc:mongodb://<host>:<port>/<database>`

**DynamoDB driver (`@alt-javascript/jsnosqlc-dynamodb`)**
- `DynamoDriver`, `DynamoClient`, `LazyDynamoCollection`, `DynamoCollection`, `DynamoFilterTranslator`
- Auto-creates DynamoDB tables on first collection use
- Full compliance suite passing against DynamoDB Local
- URL: `jsnosqlc:dynamodb:<region>`

**Google Firestore driver (`@alt-javascript/jsnosqlc-firestore`)**
- `FirestoreDriver`, `FirestoreClient`, `FirestoreCollection`, `FirestoreFilterTranslator`
- Native SDK filter chaining for `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`
- Client-side fallback for `or` and `not` via `MemoryFilterEvaluator`
- Full compliance suite passing against Firestore Emulator
- URL: `jsnosqlc:firestore:<gcp-project-id>`

**Azure Cosmos DB driver (`@alt-javascript/jsnosqlc-cosmosdb`)**
- `CosmosDriver`, `CosmosClient`, `CosmosCollection`, `CosmosFilterTranslator`
- Parameterised Cosmos DB SQL query construction for all 10 operators + `or`/`not`
- Auto-creates Cosmos DB database and container on first use
- Full compliance suite passing against Cosmos DB Linux Emulator (vnext-preview)
- URL: `jsnosqlc:cosmosdb:local` / `jsnosqlc:cosmosdb:<https-endpoint>`

**Redis driver (`@alt-javascript/jsnosqlc-redis`)**
- `RedisDriver`, `RedisClient`, `RedisCollection` — Redis storage via ioredis
- Secondary key index (Redis Set) per collection for efficient full-collection fetch
- In-memory filter evaluation for `find()` via `MemoryFilterEvaluator`
- Full compliance suite passing against Redis 7
- URL: `jsnosqlc:redis://<host>:<port>[/<db>]`

**Apache Cassandra driver (`@alt-javascript/jsnosqlc-cassandra`)**
- `CassandraDriver`, `CassandraClient`, `CassandraCollection`, `CassandraFilterTranslator`
- JSON-column schema: `CREATE TABLE (pk text PRIMARY KEY, data text)`
- Auto-creates keyspace (SimpleStrategy) and tables on first use
- Full compliance suite passing against Cassandra 4
- URL: `jsnosqlc:cassandra:<host>:<port>/<keyspace>`

**Documentation**
- Root `README.md` with quick-start for all 8 drivers
- Per-package `README.md` for all 8 packages
- `docs/getting-started.md` — tutorial
- `docs/api-reference.md` — complete interface reference
- `docs/driver-guide.md` — guide for writing new drivers
- `docs/jdbc-migration.md` — guide for JDBC developers

**CI/CD**
- GitHub Actions workflow: unit tests on Node.js 18, 20, 22
- GitHub Actions workflow: integration tests for MongoDB + DynamoDB
- GitHub Actions workflow: integration tests for Firestore + Cosmos DB
- GitHub Actions workflow: integration tests for Redis + Cassandra
- GitHub Actions publish workflow: publishes all 8 packages to npm on `v*` tag

[1.1.1]: https://github.com/alt-javascript/jsnosqlc/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/alt-javascript/jsnosqlc/compare/v1.0.1...v1.1.0
[1.0.0]: https://github.com/alt-javascript/jsnosqlc/releases/tag/v1.0.0
