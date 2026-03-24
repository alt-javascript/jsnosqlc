# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning: [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-03-24

Initial public release of all packages.

### Added

**Core (`@alt-javascript/jsnoslqc-core`)**
- `Driver` — abstract base class for all jsnoslqc drivers
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

**In-memory driver (`@alt-javascript/jsnoslqc-memory`)**
- `MemoryDriver`, `MemoryClient`, `MemoryCollection` — zero-dependency in-memory implementation
- `MemoryFilterEvaluator` — in-memory filter evaluation for all 10 operators + `or`/`not`
- URL: `jsnoslqc:memory:`

**MongoDB driver (`@alt-javascript/jsnoslqc-mongodb`)**
- `MongoDriver`, `MongoClient`, `MongoCollection`, `MongoFilterTranslator`
- Full compliance suite passing against MongoDB 7
- URL: `jsnoslqc:mongodb://<host>:<port>/<database>`

**DynamoDB driver (`@alt-javascript/jsnoslqc-dynamodb`)**
- `DynamoDriver`, `DynamoClient`, `LazyDynamoCollection`, `DynamoCollection`, `DynamoFilterTranslator`
- Auto-creates DynamoDB tables on first collection use
- Full compliance suite passing against DynamoDB Local
- URL: `jsnoslqc:dynamodb:<region>`

**Google Firestore driver (`@alt-javascript/jsnoslqc-firestore`)**
- `FirestoreDriver`, `FirestoreClient`, `FirestoreCollection`, `FirestoreFilterTranslator`
- Native SDK filter chaining for `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`
- Client-side fallback for `or` and `not` via `MemoryFilterEvaluator`
- Full compliance suite passing against Firestore Emulator
- URL: `jsnoslqc:firestore:<gcp-project-id>`

**Azure Cosmos DB driver (`@alt-javascript/jsnoslqc-cosmosdb`)**
- `CosmosDriver`, `CosmosClient`, `CosmosCollection`, `CosmosFilterTranslator`
- Parameterised Cosmos DB SQL query construction for all 10 operators + `or`/`not`
- Auto-creates Cosmos DB database and container on first use
- Full compliance suite passing against Cosmos DB Linux Emulator (vnext-preview)
- URL: `jsnoslqc:cosmosdb:local` / `jsnoslqc:cosmosdb:<https-endpoint>`

**Redis driver (`@alt-javascript/jsnoslqc-redis`)**
- `RedisDriver`, `RedisClient`, `RedisCollection` — Redis storage via ioredis
- Secondary key index (Redis Set) per collection for efficient full-collection fetch
- In-memory filter evaluation for `find()` via `MemoryFilterEvaluator`
- Full compliance suite passing against Redis 7
- URL: `jsnoslqc:redis://<host>:<port>[/<db>]`

**Apache Cassandra driver (`@alt-javascript/jsnoslqc-cassandra`)**
- `CassandraDriver`, `CassandraClient`, `CassandraCollection`, `CassandraFilterTranslator`
- JSON-column schema: `CREATE TABLE (pk text PRIMARY KEY, data text)`
- Auto-creates keyspace (SimpleStrategy) and tables on first use
- Full compliance suite passing against Cassandra 4
- URL: `jsnoslqc:cassandra:<host>:<port>/<keyspace>`

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

[1.0.0]: https://github.com/alt-javascript/jsnoslqc/releases/tag/v1.0.0
