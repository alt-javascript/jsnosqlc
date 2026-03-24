# @alt-javascript/jsnosqlc-core

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnoslqc-core)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)

Core interfaces for the JSNOSLQC unified NoSQL access layer: `Driver`, `Client`, `Collection`, `Cursor`, `Filter`, `FieldCondition`, and `DriverManager`.

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core
```

Install a driver alongside core:

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-memory
```

## Core API

### DriverManager

Routes connection requests to the appropriate registered driver.

```javascript
import { DriverManager } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-mongodb'; // self-registers on import

const client = await DriverManager.getClient('jsnoslqc:mongodb://localhost:27017/mydb');
```

### ClientDataSource

Convenience factory that mirrors the `DataSource` pattern from [jsdbc](https://github.com/alt-javascript/jsdbc).

```javascript
import { ClientDataSource } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-memory';

const ds = new ClientDataSource({ url: 'jsnoslqc:memory:' });
const client = await ds.getClient();
```

### Client

Manages the session lifecycle and a collection cache.

```javascript
const client = await DriverManager.getClient(url);

const users = client.getCollection('users'); // returns cached instance on repeat calls
console.log(client.isClosed()); // false

await client.close();
```

### Collection

Six operations on a named collection.

```javascript
const col = client.getCollection('products');

// Key-value operations
await col.store('sku-001', { name: 'Widget', price: 9.99 });
const doc = await col.get('sku-001');     // { name: 'Widget', price: 9.99 }
await col.delete('sku-001');

// Document operations (backend-assigned id)
const id = await col.insert({ name: 'Gadget', price: 24.99 });
await col.update(id, { price: 19.99 }); // patch — other fields preserved

// Query
const filter = Filter.where('price').lt(20).build();
const cursor = await col.find(filter);
```

### Cursor

Supports both cursor iteration and bulk access, with async iterator support.

```javascript
// Bulk access
const cursor = await col.find(filter);
const docs = cursor.getDocuments();

// Cursor iteration
while (await cursor.next()) {
  const doc = cursor.getDocument();
  console.log(doc);
}

// Async iterator
for await (const doc of cursor) {
  console.log(doc);
}
```

### Filter

Chainable filter builder. Produces an AST consumed by driver translators.

```javascript
import { Filter } from '@alt-javascript/jsnosqlc-core';

// Single condition
const f1 = Filter.where('status').eq('active').build();

// AND chain
const f2 = Filter.where('age').gt(18).and('country').eq('AU').build();

// OR compound (static factory — takes built AST nodes)
const f3 = Filter.or(
  Filter.where('status').eq('active').build(),
  Filter.where('status').eq('pending').build()
);

// NOT negation
const f4 = Filter.where('status').eq('inactive').not();
```

### Filter Operators

| Operator | Example | Meaning |
|---|---|---|
| `eq` | `.eq('Alice')` | Equal |
| `ne` | `.ne('inactive')` | Not equal |
| `gt` | `.gt(18)` | Greater than |
| `gte` | `.gte(18)` | Greater than or equal |
| `lt` | `.lt(100)` | Less than |
| `lte` | `.lte(100)` | Less than or equal |
| `contains` | `.contains('admin')` | Array contains element, or string contains substring |
| `in` | `.in(['a', 'b'])` | Field is one of the values |
| `nin` | `.nin(['x', 'y'])` | Field is not one of the values |
| `exists` | `.exists(true)` | Field is present (`true`) or absent (`false`) |

## Writing a Driver

See the [Driver Guide](https://github.com/alt-javascript/jsnosqlc/blob/main/docs/driver-guide.md) and [`@alt-javascript/jsnosqlc-memory`](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-memory) for a complete minimal example.

## Running Compliance Tests

The compliance suite is importable for third-party drivers:

```javascript
import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js';

runCompliance(async () => {
  const client = await DriverManager.getClient('jsnoslqc:mydriver:...');
  return client;
});
```

## License

MIT
