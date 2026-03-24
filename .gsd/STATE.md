# GSD State

**Active Milestone:** M002 — Extended Drivers (Firestore, Cosmos DB, Redis, Cassandra)
**Active Slice:** S01 — Filter builder extension (or/not) + M1 translator updates
**Active Task:** T01 — (not yet started)
**Phase:** Planning → Executing

## Recent Decisions

- M002 scope: Firestore, Cosmos DB, Redis, Cassandra + or/not filter operators
- Cosmos DB: use vnext-preview Linux emulator (ARM/Apple Silicon compatible)
- Redis find(): full SCAN + in-memory MemoryFilterEvaluator (document limitation)
- Cassandra: fixed schema (pk text PRIMARY KEY, data text), ALLOW FILTERING for complex ops
- Firestore: FIRESTORE_EMULATOR_HOST env var redirect pattern

## Blockers

- None

## Next Action

Execute S01: extend Filter with or/not AST nodes, update MongoDB and DynamoDB translators, add unit tests.
