# M001: jsnoslqc Foundation

**Vision:** Deliver a working JDBC-inspired NoSQL access layer for JavaScript: a uniform
`Client → Collection → Cursor` API with a chainable filter builder, backed by three
drivers — in-memory, MongoDB, and DynamoDB — proving the abstraction holds across
radically different storage paradigms.

## Success Criteria

- `jsnosqlc:memory:` driver passes full compliance suite: get, store, delete, find with filter
- `jsnosqlc:mongodb://...` driver connects to a real MongoDB instance and passes compliance suite
- `jsnosqlc:dynamodb:...` driver connects to a real DynamoDB endpoint and passes compliance suite
- Filter builder compiles `where('age').gt(18).and('name').eq('Alice')` to correct native queries on both MongoDB and DynamoDB
- Driver auto-registration works: import the driver package, then open a client via URL — no manual setup
- CI runs core + memory + mongodb + dynamodb (integration tests gated on available services)

## Key Risks / Unknowns

- Filter AST translation — DynamoDB's FilterExpression syntax is complex (named attributes, expression values); may require non-trivial mapping — validates in S04
- DynamoDB scan vs query — full-scan filter is expensive and limited; understanding the API surface before committing to the interface — addressed in S01 research embedded in S04

## Proof Strategy

- Filter complexity (DynamoDB) → retire in S04 by shipping `find(filter)` that runs real DynamoDB scan and passes compliance tests

## Verification Classes

- Contract verification: mocha + chai compliance suite in `packages/core/test/driverCompliance.js` — all drivers pass it
- Integration verification: MongoDB driver tested against real mongod (docker or Atlas); DynamoDB driver tested against DynamoDB Local (docker) or real AWS
- Operational verification: DriverManager auto-registration exercised on import in each driver package's test bootstrap
- UAT / human verification: README quick-start code block runs without modification

## Milestone Definition of Done

- All four packages build and export correct named symbols
- Memory driver passes all compliance tests (no external deps)
- MongoDB driver passes all compliance tests against a live mongod
- DynamoDB driver passes all compliance tests against DynamoDB Local
- Filter builder translates all M1 operators correctly for both backends (verified by compliance suite)
- `npm test` in project root runs core + memory tests (CI-safe, no external deps)
- `npm run test:integration` runs mongodb + dynamodb tests (requires services)
- README quick-start is accurate

## Slices

- [ ] **S01: Core Interfaces and Filter Builder** `risk:high` `depends:[]`
  > After this: the complete interface contract (Driver, Client, Collection, Cursor, Filter, DriverManager) exists with full test coverage of the filter builder and compliance suite skeleton.

- [ ] **S02: In-Memory Driver** `risk:low` `depends:[S01]`
  > After this: `jsnosqlc:memory:` driver passes 100% of the compliance suite — you can get, store, delete, and find with filter in pure JavaScript with no external dependencies.

- [ ] **S03: MongoDB Driver** `risk:medium` `depends:[S01]`
  > After this: `jsnosqlc:mongodb://...` connects to a real MongoDB instance and passes the full compliance suite — filter builder operators translate correctly to MongoDB query documents.

- [ ] **S04: DynamoDB Driver** `risk:high` `depends:[S01]`
  > After this: `jsnosqlc:dynamodb:...` connects to DynamoDB Local and passes the compliance suite — filter builder operators translate to DynamoDB FilterExpression syntax correctly.

- [ ] **S05: Monorepo Wiring, README, and CI** `risk:low` `depends:[S02,S03,S04]`
  > After this: root `package.json` scripts work, README quick-start runs as written, and the CI workflow runs the correct test tiers.

## Boundary Map

### S01 → S02, S03, S04

Produces:
- `Driver` base class — `acceptsURL(url): boolean`, `connect(url, props): Promise<Client>`
- `Client` base class — `getCollection(name): Collection`, `close(): Promise<void>`
- `Collection` base class — `get(key): Promise<doc>`, `store(key, doc): Promise<void>`, `delete(key): Promise<void>`, `find(filter): Promise<Cursor>`, `insert(doc): Promise<void>`, `update(key, patch): Promise<void>`
- `Cursor` base class — `next(): Promise<boolean>`, `getDocument(): Object`, `getDocuments(): Object[]`, `close(): Promise<void>`, async iterator protocol
- `Filter` class — `Filter.where(field)` → FieldCondition → chainable `.eq()`, `.ne()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.contains()`, `.in()`, `.nin()`, `.exists()`, `.and(field)` returning new FieldCondition; `.build()` returns AST
- `DriverManager` — `registerDriver(d)`, `deregisterDriver(d)`, `getClient(url, props)`, `clear()`
- `UnsupportedOperationError` — thrown by base class methods not implemented by a driver
- `packages/core/test/driverCompliance.js` — shared test suite exportable by driver packages

### S02 → S05

Produces:
- `@alt-javascript/jsnosqlc-memory` package, self-registers `jsnosqlc:memory:` URL prefix
- Passes driverCompliance fully

### S03 → S05

Produces:
- `@alt-javascript/jsnosqlc-mongodb` package, self-registers `jsnosqlc:mongodb:` URL prefix
- Passes driverCompliance against real mongod
- Filter AST → MongoDB query document translator

### S04 → S05

Produces:
- `@alt-javascript/jsnosqlc-dynamodb` package, self-registers `jsnosqlc:dynamodb:` URL prefix
- Passes driverCompliance against DynamoDB Local
- Filter AST → DynamoDB FilterExpression + ExpressionAttributeNames + ExpressionAttributeValues translator

### S05 (terminal)

Produces:
- Root `package.json` with `npm test` (core + memory) and `npm run test:integration` scripts
- `README.md` with accurate quick-start for all three real drivers
- `.github/workflows/node.js.yml` CI config
