# GSD State

**Active Milestone:** M001 — jsnoslqc Foundation
**Active Slice:** — (all slices complete)
**Active Task:** — (complete)
**Phase:** Complete

## Recent Decisions

- `_store` is a reserved method name in Collection base class — use `_map` for backing store in MemoryCollection
- insert() generates string ids (timestamp+random hex) for consistent get-by-id across all drivers
- DynamoDB `in` operator emitted as OR chain of equality; `nin` as AND chain of inequality (no native $in)
- MongoDB `contains` uses MongoDB's native array element matching (no $elemMatch needed)
- DynamoDB tables created lazily on first operation via LazyDynamoCollection

## Blockers

- None

## Next Action

M001 complete. Consider M002 targets: additional drivers (Redis, Firestore, Cassandra), or/$or filter support, transaction API, streaming cursors.
