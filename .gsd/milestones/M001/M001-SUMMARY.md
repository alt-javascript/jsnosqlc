---
id: M001
provides:
  - "@alt-javascript/jsnosqlc-core: Driver/Client/Collection/Cursor/Filter/DriverManager interfaces"
  - "Chainable filter builder: Filter.where(f).op(v).and(f2).op2(v2).build() → AST"
  - "@alt-javascript/jsnosqlc-memory: in-memory driver, 24 compliance tests"
  - "@alt-javascript/jsnosqlc-mongodb: MongoDB driver via mongodb npm, 25 compliance tests"
  - "@alt-javascript/jsnosqlc-dynamodb: DynamoDB driver via @aws-sdk, 25 compliance tests"
  - "Shared driverCompliance.js test suite for driver packages"
  - "GitHub Actions CI: unit tests (Node 18/20/22) + integration tests with services"
key_files:
  - packages/core/index.js
  - packages/core/Filter.js
  - packages/core/FieldCondition.js
  - packages/core/Client.js
  - packages/core/Collection.js
  - packages/core/Cursor.js
  - packages/core/DriverManager.js
  - packages/core/test/driverCompliance.js
  - packages/memory/MemoryDriver.js
  - packages/memory/MemoryFilterEvaluator.js
  - packages/mongodb/MongoDriver.js
  - packages/mongodb/MongoFilterTranslator.js
  - packages/dynamodb/DynamoDriver.js
  - packages/dynamodb/DynamoFilterTranslator.js
  - packages/dynamodb/DynamoClient.js
key_decisions:
  - "Do NOT name Collection subclass backing stores '_store' — conflicts with Collection._store() override method. Use '_map' or '_col' etc."
  - "insert() generates string ids (timestamp+random hex) for consistent get(insertedId) across all drivers"
  - "DynamoDB 'in' → OR chain of equality; 'nin' → AND chain of inequality (no native $in/$nin)"
  - "DynamoDB tables created lazily on first operation via LazyDynamoCollection pattern"
  - "MongoDB 'contains' uses native array element matching — no $elemMatch needed"
  - "Filter.build() returns leaf directly for 1 condition; wraps in {type:'and'} for 2+"
patterns_established:
  - "Auto-registration: DriverManager.registerDriver(new MyDriver()) at bottom of driver file"
  - "runCompliance(clientFactory) in test/driverCompliance.js — all drivers must pass it"
  - "LazyDynamoCollection — ensures table existence before first operation"
  - "URL scheme: jsnoslqc:<subprotocol>:<details>"
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/S01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/S02-SUMMARY.md
  - .gsd/milestones/M001/M001-ROADMAP.md
duration: 1 session
verification_result: pass
completed_at: 2026-03-24T12:00:00Z
---

# M001: jsnoslqc Foundation

**50 unit tests + 50 integration tests passing across memory, MongoDB, and DynamoDB drivers.**

## What Was Built

A JDBC-inspired unified NoSQL access layer for JavaScript. Four packages:

**Core** (`@alt-javascript/jsnosqlc-core`): The interface contract. `Driver` base, `DriverManager` static registry, `Client` (connection equivalent), `Collection` (statement equivalent with 6 ops), `Cursor` (resultset equivalent with asyncIterator), `Filter` chainable builder with 10 operators and AST output, `FieldCondition` per-field operator chains, `UnsupportedOperationError`. Shared `driverCompliance.js` test suite exportable by all driver packages.

**Memory** (`@alt-javascript/jsnosqlc-memory`): In-memory driver backed by `Map`. Zero external dependencies. `MemoryFilterEvaluator` applies the Filter AST directly to JS objects. Handles dot-notation field resolution.

**MongoDB** (`@alt-javascript/jsnosqlc-mongodb`): Wraps the official `mongodb` npm package. `MongoFilterTranslator` converts AST to MongoDB query documents. Uses string ids for consistent `get(insertedId)` behavior (avoids ObjectId/string type mismatch). Graceful skip when MongoDB is unreachable.

**DynamoDB** (`@alt-javascript/jsnosqlc-dynamodb`): Wraps `@aws-sdk/lib-dynamodb` DocumentClient. `DynamoFilterTranslator` converts AST to `FilterExpression` with `ExpressionAttributeNames` and `ExpressionAttributeValues`. `LazyDynamoCollection` creates tables on first use. Handles DynamoDB scan pagination. Graceful skip when DynamoDB is unreachable.

## Verification Results

- `npm test` (root): **50 tests passing** — core + memory, no external deps
- `npm test` (packages/mongodb): **25 tests passing** — against MongoDB 7 in Docker
- `npm test` (packages/dynamodb): **25 tests passing** — against DynamoDB Local in Docker
- All 10 filter operators verified on all three backends

## Deviations from Roadmap

- S01-S05 delivered as planned, in order
- One name collision caught during S02: `_store` property vs `Collection._store()` method → fixed by using `_map`
- MongoDB `insert()` initially used ObjectId but string comparison failed → switched to string id generation (same as memory driver)
