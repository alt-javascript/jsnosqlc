---
estimated_steps: 16
estimated_files: 2
skills_used: []
---

# T04: Implement LocalStorageClient and LocalStorageDriver

Create LocalStorageClient.js and LocalStorageDriver.js.

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

## Inputs

- `packages/memory/MemoryClient.js`
- `packages/memory/MemoryDriver.js`
- `packages/localstorage/LocalStorageCollection.js`

## Expected Output

- `packages/localstorage/LocalStorageClient.js`
- `packages/localstorage/LocalStorageDriver.js`

## Verification

node --input-type=module <<'EOF'
import { DriverManager } from './packages/localstorage/index.js';
console.log('drivers:', DriverManager.getDrivers().map(d=>d.constructor.name));
EOF
