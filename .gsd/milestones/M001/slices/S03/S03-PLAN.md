# S03: MongoDB Driver

**Goal:** Ship a working `jsnosqlc:mongodb://...` driver that passes the full compliance suite against a real MongoDB instance.
**Demo:** `npm test` in `packages/mongodb` runs the compliance suite against MongoDB and all 24 tests pass.

## Must-Haves

- `packages/mongodb/MongoDriver.js` self-registers under `jsnosqlc:mongodb:` prefix
- URL scheme: `jsnosqlc:mongodb://host:port/database` (strips prefix, passes remainder to `mongodb` driver)
- `MongoCollection` implements all 6 operations via official `mongodb` npm package
- Filter AST → MongoDB query document translator handles all 10 operators and compound `and`
- `store(key, doc)` upserts by `_id: key`; `get(key)` finds by `_id: key`
- All 24 compliance tests pass
- Tests are gated: skip gracefully if MongoDB is not reachable

## Tasks

- [ ] **T01: MongoDriver, MongoClient, MongoCollection scaffold**
  Wire up the driver and client using the official `mongodb` package. Implement get/store/delete.

- [ ] **T02: Filter AST → MongoDB query translator + find/insert/update**
  Implement `MongoFilterTranslator` that converts the Filter AST to a MongoDB query document.
  Wire find/insert/update operations.

- [ ] **T03: Compliance suite run**
  Wire compliance test, handle connection setup/teardown, ensure graceful skip when MongoDB is unavailable.

## Files Likely Touched

- `packages/mongodb/package.json`
- `packages/mongodb/index.js`
- `packages/mongodb/MongoDriver.js`
- `packages/mongodb/MongoClient.js`
- `packages/mongodb/MongoCollection.js`
- `packages/mongodb/MongoFilterTranslator.js`
- `packages/mongodb/test/compliance.spec.js`
