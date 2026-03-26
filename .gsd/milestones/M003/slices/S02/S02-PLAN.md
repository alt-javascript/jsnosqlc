# S02: LocalStorage and SessionStorage drivers

**Goal:** Implement packages/localstorage with LocalStorageDriver and SessionStorageDriver. Full compliance suite passes using an injected MockStorage (no jsdom, no browser needed).
**Demo:** After this: After this: `npm test --workspace=packages/localstorage` passes the full compliance suite for both `jsnosqlc:localstorage:` and `jsnosqlc:sessionstorage:` using an injected in-memory mock — no browser required.

## Tasks
- [x] **T01: packages/localstorage scaffolded and linked in workspace** — Create packages/localstorage/ with package.json, index.js, README.md skeleton. The package name is @alt-javascript/jsnosqlc-localstorage. Follow the memory package structure. Add rollup.config.js following the S01 pattern (treeshake:false, node-resolve, inline core). Add to root workspace list.
  - Estimate: 15m
  - Files: packages/localstorage/package.json, packages/localstorage/index.js, packages/localstorage/rollup.config.js, package.json
  - Verify: ls packages/localstorage/
- [x] **T02: MockStorage implemented and verified: getItem/setItem/removeItem/clear/length/key all pass** — Create MockStorage.js — an in-memory Web Storage API-compatible object (getItem, setItem, removeItem, clear, length, key). No localStorage needed. The _store backing is a plain Map. Export it for test imports.
  - Estimate: 20m
  - Files: packages/localstorage/MockStorage.js
  - Verify: node --input-type=module <<'EOF'
import MockStorage from './packages/localstorage/MockStorage.js';
const s = new MockStorage();
s.setItem('a', '1');
console.assert(s.getItem('a') === '1');
console.assert(s.length === 1);
s.removeItem('a');
console.assert(s.getItem('a') === null);
console.log('MockStorage OK');
EOF
- [x] **T03: LocalStorageCollection implemented — all 6 ops working with namespaced keys and find() via MemoryFilterEvaluator** — Create LocalStorageCollection.js.

Key namespacing scheme: `<clientId>:<collectionName>:<docKey>`
  - clientId: generated at LocalStorageClient construction (timestamp+rand hex, like memory ids)
  - Prevents cross-client and cross-collection contamination

All values stored as JSON.stringify(doc). All reads use JSON.parse.

_get(key): storage.getItem(nsKey) → parse or null
_store(key, doc): storage.setItem(nsKey, stringify)
_delete(key): storage.removeItem(nsKey)
_insert(doc): generate id, _store(id, {...doc, _id:id}), return id
_update(key, patch): _get(key) → merge → _store
_find(ast): iterate all storage keys with the prefix `<clientId>:<collectionName>:`, parse each, apply MemoryFilterEvaluator, return Cursor

For _find key iteration: storage is Web Storage — use storage.length + storage.key(i) to iterate all keys, filter by prefix.
  - Estimate: 30m
  - Files: packages/localstorage/LocalStorageCollection.js
  - Verify: node --input-type=module <<'EOF'
import MockStorage from './packages/localstorage/MockStorage.js';
import LocalStorageCollection from './packages/localstorage/LocalStorageCollection.js';
const col = new LocalStorageCollection(null, 'test', MockStorage.create('c1'), new MockStorage());
await col.store('k1', {name:'Alice'});
const doc = await col.get('k1');
console.assert(doc.name === 'Alice', 'get failed');
console.log('LocalStorageCollection OK');
EOF
- [x] **T04: LocalStorageClient and both drivers implemented; auto-registration confirmed** — Create LocalStorageClient.js and LocalStorageDriver.js.

LocalStorageClient:
  - constructor(url, storageBackend) — storageBackend defaults to globalThis.localStorage
  - generates a clientId on construction
  - _getCollection(name): returns new LocalStorageCollection(this, name, this._clientId, this._storage)
  - _close(): no-op (Web Storage has no connection concept)

LocalStorageDriver:
  - static URL_PREFIX = 'jsnosqlc:localstorage:'
  - acceptsURL: startsWith prefix
  - connect(url, properties): new LocalStorageClient(url, properties.storageBackend ?? globalThis.localStorage)
  - Auto-registers with DriverManager

SessionStorageDriver:
  - static URL_PREFIX = 'jsnosqlc:sessionstorage:'
  - connect(url, properties): new LocalStorageClient(url, properties.storageBackend ?? globalThis.sessionStorage)
  - Auto-registers with DriverManager

Both drivers are registered in the same file to keep things simple.
  - Estimate: 25m
  - Files: packages/localstorage/LocalStorageClient.js, packages/localstorage/LocalStorageDriver.js
  - Verify: node --input-type=module <<'EOF'
import { DriverManager } from './packages/localstorage/index.js';
console.log('drivers:', DriverManager.getDrivers().map(d=>d.constructor.name));
EOF
- [x] **T05: 51/51 compliance tests pass for localStorage and sessionStorage drivers; 106 total root tests pass** — Write packages/localstorage/test/compliance.spec.js.

Two describe blocks: 'localStorage driver compliance' and 'sessionStorage driver compliance'.

Each block:
  1. Imports runCompliance from @alt-javascript/jsnosqlc-core/test/driverCompliance.js
  2. Creates a MockStorage instance
  3. Calls runCompliance(() => DriverManager.getClient('jsnosqlc:localstorage:', { storageBackend: mockStorage }))
  (or sessionstorage URL for the second block)
  4. Adds a cross-contamination test: two clients with the same MockStorage, different clientIds, store overlapping keys — confirm no bleed.

Then run npm test and confirm all compliance tests pass.
  - Estimate: 30m
  - Files: packages/localstorage/test/compliance.spec.js
  - Verify: npm test --workspace=packages/localstorage
