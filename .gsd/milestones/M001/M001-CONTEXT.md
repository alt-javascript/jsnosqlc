# M001: jsnosqlc Foundation — Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

## Project Goal

JSDBC-inspired unified NoSQL access layer for JavaScript. Where jsdbc wraps disparate SQL
drivers behind a common Connection/Statement/ResultSet API, jsnosqlc wraps disparate NoSQL
and key-value stores behind a common Client/Collection/Cursor API.

## Scope for M1

**Core interfaces + in-memory driver + MongoDB driver + DynamoDB driver.**

Delivers a working, testable system across two very different NoSQL backends (document
and key-value/wide-column) to validate the abstraction boundary.

## Architecture Decisions (from user discussion)

- Mirror jsdbc's monorepo layout: `packages/core`, `packages/memory`, `packages/mongodb`,
  `packages/dynamodb`
- ESM throughout (`"type": "module"`)
- Driver auto-registration on import (same pattern as jsdbc)
- URL scheme: `jsnosqlc:<subprotocol>:<connection-details>`
  e.g. `jsnosqlc:mongodb://localhost:27017/mydb`, `jsnosqlc:dynamodb:us-east-1`
- **Filter syntax:** Chainable builder API
  `Filter.where('age').gt(18).and('name').eq('Alice')`
- Collections (not tables): `client.getCollection('users')`
- Primary operations: `get(key)`, `store(key, doc)`, `delete(key)`, `find(filter)`, `insert(doc)`, `update(key, patch)`
- No transaction API in M1 (NoSQL world is diverse here — defer to M2)

## Key-Value vs Document Distinction

Key-value stores (DynamoDB with simple key, Redis, etc.):
- `get(key)` / `store(key, doc)` / `delete(key)` — primary surface
- `find(filter)` supported only where the backend has scan/query capability

Document stores (MongoDB, Firestore, etc.):
- `find(filter)` is the primary surface
- `get`/`store`/`delete` by `_id`

Both backends implement the same `Collection` interface; drivers may throw
`UnsupportedOperationError` for operations genuinely unavailable.

## Filter Builder Design

```javascript
Filter.where('age').gt(18).and('status').eq('active').and('tags').contains('js')
```

Supported operators (M1): `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`, `exists`

Filter compiles to an AST (intermediate representation). Each driver translates the AST
to its native query format.

## Monorepo Structure

```
packages/
  core/         — interfaces: Driver, Client, Collection, Cursor, Filter, DriverManager
  memory/       — in-memory driver (for testing + fast dev iteration)
  mongodb/      — MongoDB driver via official mongodb npm package
  dynamodb/     — DynamoDB driver via @aws-sdk/client-dynamodb
```

## Agent's Discretion

- Exact Filter AST node shape
- Error class hierarchy
- How Cursor implements async iteration (AsyncIterator protocol vs explicit next())
- Test framework choice (follow jsdbc: mocha + chai)
- Whether memory driver stores globally or per-client (per-client is cleaner)
