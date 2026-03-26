# @alt-javascript/jsnosqlc-localstorage

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnosqlc-localstorage)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-localstorage)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Browser localStorage and sessionStorage driver for JSNOSLQC. Implements the full NoSQL Collection interface over the Web Storage API — making jsnosqlc code isomorphic across Node.js and the browser.

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-localstorage
```

## Browser Usage (ESM bundle)

No bundler required. Import the pre-built ESM bundle directly:

```html
<script type="module">
  import { DriverManager, Filter } from
    'https://unpkg.com/@alt-javascript/jsnosqlc-localstorage/dist/jsnosqlc-localstorage.esm.js';

  const client = await DriverManager.getClient('jsnosqlc:localstorage:');
  const users = client.getCollection('users');

  await users.store('u1', { name: 'Alice', age: 30 });
  const alice = await users.get('u1'); // { name: 'Alice', age: 30 }

  const id = await users.insert({ name: 'Bob', age: 25 });

  const filter = Filter.where('age').gte(25).build();
  const cursor = await users.find(filter);
  console.log(cursor.getDocuments()); // [Alice, Bob]

  await client.close();
</script>
```

The bundle includes core (DriverManager, Filter, etc.) inlined — no import maps needed.

## Node.js Usage (isomorphic testing)

In Node.js, inject a `MockStorage` in place of `globalThis.localStorage`:

```javascript
import { DriverManager, MockStorage } from '@alt-javascript/jsnosqlc-localstorage';

const client = await DriverManager.getClient('jsnosqlc:localstorage:', {
  storageBackend: new MockStorage(),
});

const col = client.getCollection('orders');
await col.store('o1', { total: 59.99, status: 'pending' });
```

This pattern works in any Node.js environment — Mocha, Jest, CI — with no browser or jsdom dependency.

## URLs

| URL | Backend | Persistence |
|---|---|---|
| `jsnosqlc:localstorage:` | `localStorage` (or injected `storageBackend`) | Survives page reload |
| `jsnosqlc:sessionstorage:` | `sessionStorage` (or injected `storageBackend`) | Cleared when tab closes |

## Key Namespacing

All keys are stored with the prefix `<clientId>:<collectionName>:<docKey>`. The `clientId` is generated per `DriverManager.getClient()` call, so multiple clients sharing the same physical storage backend cannot overwrite each other's data.

You can inspect the raw keys in Chrome DevTools → Application → Local Storage.

## Supported Operations

All six Collection operations are supported: `get`, `store`, `delete`, `insert`, `update`, `find`.

All ten Filter operators are supported via `MemoryFilterEvaluator`: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`, `exists`. Compound operators `Filter.or()` and `.not()` are supported.

> ⚠ **Performance note:** `find()` iterates all keys in storage with the matching collection prefix. This is bounded by the number of documents in the collection, not the total number of keys in storage. For typical browser usage (hundreds to low thousands of documents) this is fast. It is not suitable for collections exceeding available localStorage quota (~5–10 MB depending on browser).

## MockStorage

`MockStorage` is an in-memory implementation of the Web Storage API (`getItem`, `setItem`, `removeItem`, `clear`, `length`, `key`). It is the recommended way to test localstorage-backed code in Node.js:

```javascript
import { MockStorage } from '@alt-javascript/jsnosqlc-localstorage';

const storage = new MockStorage();
storage.setItem('key', 'value');
console.log(storage.getItem('key')); // 'value'
console.log(storage.length);         // 1
```

## ClientDataSource

```javascript
import { ClientDataSource, MockStorage } from '@alt-javascript/jsnosqlc-localstorage';

const ds = new ClientDataSource({
  url: 'jsnosqlc:localstorage:',
  properties: { storageBackend: new MockStorage() },
});
const client = await ds.getClient();
```

## When to Use

- **Browser persistence** — store and query structured documents across page reloads
- **Offline-first apps** — local data layer when the server is unreachable
- **Isomorphic code** — same business logic in Node.js (injected MockStorage) and browser (native localStorage)
- **Testing browser storage logic** — full compliance suite in Node.js without jsdom

## License

MIT
