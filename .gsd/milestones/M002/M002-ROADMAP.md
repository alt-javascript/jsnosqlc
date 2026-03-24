# M002: Extended Drivers — Firestore, Cosmos DB, Redis, Cassandra

**Vision:** Extend jsnoslqc's driver coverage to the major cloud and open-source NoSQL ecosystems:
Google Firestore (GCP), Azure Cosmos DB, Redis, and Apache Cassandra. Add `or`/`not` compound
operators to the filter builder so all drivers can express richer queries natively.

## Success Criteria

- Filter builder supports `Filter.or(f1, f2)` → `{ type:'or', conditions:[...] }` AST
- Filter builder supports `.not()` → `{ type:'not', condition:{...} }` AST
- All existing M1 translators (MongoDB, DynamoDB) handle `or` and `not` AST nodes
- Firestore driver passes full compliance suite against Firestore emulator
- Cosmos DB driver passes full compliance suite against Cosmos DB Linux emulator
- Redis driver passes compliance suite (find tests flagged as ⚠ SLOW SCAN — all pass)
- Cassandra driver passes compliance suite (CQL-based ops + mixed client-side find)
- `npm test` (root) still passes — core, memory drivers unaffected
- `npm run test:integration` scope updated to include all 4 new drivers

## Key Risks / Unknowns

- Cosmos DB emulator TLS (self-signed cert) — JS SDK requires `NODE_TLS_REJECT_UNAUTHORIZED=0` for local; must work in CI without cert import ceremony
- Firestore emulator startup time (Java-based) — may need 30s+ timeout in tests
- Redis `find()` full-scan scalability — not production-suitable but within compliance test scope
- Cassandra `ALLOW FILTERING` — compliance tests use small data sets so it passes; production users must be warned

## Proof Strategy

- Cosmos DB TLS risk → retire in S03 by proving compliance suite passes with the vnext-preview emulator
- Firestore emulator latency → retire in S02 by proving suite passes with 30s timeout

## Verification Classes

- Contract verification: mocha + chai compliance suite for each new driver
- Integration verification: all 4 drivers tested against Docker-based local services
- Operational verification: graceful skip when service is unreachable (same pattern as M1)
- UAT / human verification: README quick-start examples for each driver run without modification

## Milestone Definition of Done

- Filter builder exports `or` and `not` — unit tests pass in `packages/core`
- M1 translators (MongoDB, DynamoDB) updated for `or`/`not` — compliance retested
- All 4 new driver packages exist and pass compliance suite
- Root `npm test` still passes (50 tests)
- README updated with Firestore, Cosmos DB, Redis, Cassandra quick-starts
- CI workflow updated with 4 new integration jobs

## Slices

- [ ] **S01: Filter builder extension (or/not) + M1 translator updates** `risk:low` `depends:[]`
  > After this: `Filter.or(f1, f2)` and `filter.not()` work, unit-tested, MongoDB and DynamoDB translators handle the new AST nodes.

- [ ] **S02: Google Firestore driver** `risk:medium` `depends:[S01]`
  > After this: `jsnoslqc:firestore:<project>` connects to the Firestore emulator and passes the full compliance suite including `or` filter.

- [ ] **S03: Azure Cosmos DB driver** `risk:high` `depends:[S01]`
  > After this: `jsnoslqc:cosmosdb:local` connects to the Cosmos DB Linux emulator (vnext-preview) and passes the compliance suite — TLS risk retired.

- [ ] **S04: Redis driver** `risk:low` `depends:[S01]`
  > After this: `jsnoslqc:redis://localhost:6379` passes the compliance suite — find() uses in-memory scan, documented as not production-scalable.

- [ ] **S05: Cassandra driver** `risk:medium` `depends:[S01]`
  > After this: `jsnoslqc:cassandra:localhost:9042/jsnoslqc` passes the compliance suite — CQL WHERE for native operators, client-side filter for contains/in/nin/exists.

- [ ] **S06: README, CI, and root wiring** `risk:low` `depends:[S02,S03,S04,S05]`
  > After this: README quick-starts cover all 7 drivers, CI adds 4 new integration jobs, `npm run test:integration` runs all drivers.

## Boundary Map

### S01 → S02, S03, S04, S05

Produces:
- `Filter.or(filter1, filter2)` static factory → `{ type: 'or', conditions: [ast1, ast2] }`
- `filter.not()` instance method → `{ type: 'not', condition: ast }`
- Updated `MongoFilterTranslator`: `or` → `{ $or: [...] }`, `not` → `{ $nor: [cond] }` (or `{ field: { $not: expr } }`)
- Updated `DynamoFilterTranslator`: `or` → `(expr1 OR expr2)`, `not` → `NOT (expr)`
- New core unit tests for `or`/`not` builders and translator updates

### S02 → S06

Produces:
- `@alt-javascript/jsnosqlc-firestore` — self-registers `jsnoslqc:firestore:` prefix
- `FirestoreFilterTranslator`: AST → Firestore SDK `.where()` chain (including `.or()`)
- Passes full compliance suite against Firestore emulator

### S03 → S06

Produces:
- `@alt-javascript/jsnosqlc-cosmosdb` — self-registers `jsnoslqc:cosmosdb:` prefix
- `CosmosFilterTranslator`: AST → Cosmos DB SQL query string (parameterized)
- Passes full compliance suite against Cosmos DB Linux emulator (vnext-preview)

### S04 → S06

Produces:
- `@alt-javascript/jsnosqlc-redis` — self-registers `jsnoslqc:redis:` prefix
- `find()` implemented via SCAN + in-memory MemoryFilterEvaluator
- Passes compliance suite; find() documented as full-scan

### S05 → S06

Produces:
- `@alt-javascript/jsnosqlc-cassandra` — self-registers `jsnoslqc:cassandra:` prefix
- CQL translator for native operators; MemoryFilterEvaluator fallback for contains/in/nin/exists
- Passes compliance suite

### S06 (terminal)

Produces:
- Updated README with 4 new driver quick-starts
- Updated CI workflow with 4 new integration jobs
- Root `package.json` test:integration covers all 6 integration drivers
