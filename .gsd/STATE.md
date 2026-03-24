# GSD State

**Active Milestone:** M002 — Extended Drivers
**Active Slice:** — (all slices complete)
**Active Task:** — (complete)
**Phase:** Complete

## Recent Decisions

- Cosmos DB vnext-preview emulator serves HTTP (not HTTPS) on 8081 — drop TLS agent for local connections
- Cosmos DB partition key spec requires `{ paths: ['/id'], kind: 'Hash' }` — vnext-preview validates `kind`
- Redis find() uses secondary key index (Set) per collection, not SCAN of full keyspace
- Cassandra find() uses full table SELECT + client-side filter — documents this limitation
- Firestore `not` operator not supported natively — falls back to client-side filter via MemoryFilterEvaluator

## Blockers

- None

## Next Action

M002 complete. 8 drivers shipped (memory, MongoDB, DynamoDB, Firestore, Cosmos DB, Redis, Cassandra).
Consider M003: streaming cursors, transaction API, or/not compliance test extension, connection pooling.
