---
estimated_steps: 12
estimated_files: 1
skills_used: []
---

# T03: Implement LocalStorageCollection

Create LocalStorageCollection.js.

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

## Inputs

- `packages/memory/MemoryCollection.js`
- `packages/memory/MemoryFilterEvaluator.js`
- `packages/core/Collection.js`
- `packages/core/Cursor.js`

## Expected Output

- `packages/localstorage/LocalStorageCollection.js`

## Verification

node --input-type=module <<'EOF'
import MockStorage from './packages/localstorage/MockStorage.js';
import LocalStorageCollection from './packages/localstorage/LocalStorageCollection.js';
const col = new LocalStorageCollection(null, 'test', MockStorage.create('c1'), new MockStorage());
await col.store('k1', {name:'Alice'});
const doc = await col.get('k1');
console.assert(doc.name === 'Alice', 'get failed');
console.log('LocalStorageCollection OK');
EOF
