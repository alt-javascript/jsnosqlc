# M002: jsnoslqc Extended Drivers — Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

## Scope for M2

Four new drivers: **Google Firestore**, **Azure Cosmos DB** (NoSQL API), **Redis**, **Cassandra**.
Plus: **filter builder extension** with `or` compound operator and `not` negation.

## Driver Assessment

### Google Firestore
- SDK: `@google-cloud/firestore@8.3.0`
- Local testing: `mtlynch/firestore-emulator` Docker image (Java-based, standalone)
  - Connect via `FIRESTORE_EMULATOR_HOST=localhost:8080` env var
  - SDK auto-detects the env var and redirects to emulator
- URL scheme: `jsnoslqc:firestore:<project-id>`
- Filter: Firestore has a native `.where()` chain — all 10 operators + compound supported
- `or` filter: Firestore supports `Query.or()` (introduced in SDK v7+) — M2 filter extension will map to this
- Note: Firestore collections don't have a pre-creation step — documents create them

### Azure Cosmos DB (NoSQL API)
- SDK: `@azure/cosmos@4.9.2`
- Local testing: `mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview`
  - Runs on port 8081, HTTPS only, self-signed cert → needs `NODE_TLS_REJECT_UNAUTHORIZED=0`
  - Apple Silicon compatible
  - Only NoSQL API supported in preview
- URL scheme: `jsnoslqc:cosmosdb:<endpoint>` or `jsnoslqc:cosmosdb:local`
- Filter: Cosmos DB uses SQL-like query strings — e.g. `SELECT * FROM c WHERE c.age > 18 AND c.status = 'active'`
- Containers (≈ collections) must exist — create on demand like DynamoDB pattern
- Emulator well-known key: `C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==`

### Redis
- SDK: `ioredis@5.10.1`
- Local testing: `redis:7` Docker, port 6379 — trivial
- URL scheme: `jsnoslqc:redis:localhost:6379` or `jsnoslqc:redis://localhost:6379`
- Operations: `get`/`store`/`delete` → native `GET`/`SET`/`DEL`
- `find()`: Redis has no native scan filter beyond `SCAN` + pattern match. Use `SCAN 0 MATCH *` to get all keys, then filter in-memory using `MemoryFilterEvaluator`. This is known to be expensive at scale — document it clearly. For Redis, `find()` is a full-scan fallback.
- Values stored as JSON strings (JSON.stringify/parse)
- `insert()`: generate id, `SET id JSON`

### Cassandra
- SDK: `cassandra-driver@4.8.0`
- Local testing: `cassandra:4` Docker, port 9042
- URL scheme: `jsnoslqc:cassandra:localhost:9042/keyspace`
- Cassandra is CQL (SQL-like) — filter translates to CQL WHERE clause
- Collections = tables. Tables must be created with a schema. jsnoslqc uses a fixed schema:
  `CREATE TABLE IF NOT EXISTS collection (pk text PRIMARY KEY, data text)` — stores doc as JSON in `data`
- `find()` with filter: CQL allows `ALLOW FILTERING` but it's expensive — document this.
  For M2: implement `find()` using `SELECT * FROM table ALLOW FILTERING` with CQL WHERE
  Operator mapping: eq→`=`, ne→`!=`, gt→`>`, gte→`>=`, lt→`<`, lte→`<=`
  `contains`, `in`, `nin`, `exists` require ALLOW FILTERING or are not supported by Cassandra natively on text columns — implement as client-side filter (fetch all, filter in memory using MemoryFilterEvaluator, document limitation)
- Keyspace must exist or be created on connect

## Filter Extension

Add to `packages/core/Filter.js`:
- `Filter.or(filter1, filter2, ...)` — static factory for OR compound
- AST node: `{ type: 'or', conditions: [...] }`
- `filter.not()` — negates the current filter
- AST node: `{ type: 'not', condition: {...} }`
- All existing drivers (MongoDB, DynamoDB) need their translators updated to handle `or` and `not` AST nodes

## Monorepo Additions

```
packages/
  firestore/   — @alt-javascript/jsnoslqc-firestore
  cosmosdb/    — @alt-javascript/jsnoslqc-cosmosdb
  redis/       — @alt-javascript/jsnoslqc-redis
  cassandra/   — @alt-javascript/jsnoslqc-cassandra
```

## Key Risks

- **Cosmos DB emulator TLS**: self-signed cert requires `NODE_TLS_REJECT_UNAUTHORIZED=0` — acceptable for testing, must be documented
- **Redis find()**: full-scan approach is not scalable — must document clearly
- **Cassandra ALLOW FILTERING**: expensive, not production-recommended — document
- **Firestore emulator startup**: Java-based, slower than DynamoDB Local — increase test timeout

## Agent's Discretion

- Exact SQL-like string generation for Cosmos DB (template literals vs builder)
- Whether Redis stores a secondary index of all keys per collection for find() (avoids global SCAN)
- Cassandra keyspace creation strategy (hardcoded replication factor)
