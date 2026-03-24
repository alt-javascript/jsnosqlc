# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning: [Semantic Versioning](https://semver.org/).

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

[1.0.0]: https://github.com/alt-javascript/jsnosqlc/releases/tag/v1.0.0
