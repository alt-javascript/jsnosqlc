# JSNOSLQC — JDBC-Inspired NoSQL Access for JavaScript

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A uniform, async NoSQL access facade for JavaScript inspired by Java's JDBC — and by [jsdbc](https://github.com/alt-javascript/jsdbc), its SQL counterpart. Write database code once against jsnoslqc interfaces, then plug in any supported driver — in-memory, MongoDB, DynamoDB, and more.

**Part of the [@alt-javascript](https://github.com/alt-javascript) ecosystem.**

## Why jsnoslqc?

JavaScript's NoSQL ecosystem is as fragmented as its SQL ecosystem. Every database — MongoDB, DynamoDB, Firestore, Redis, Cassandra — has its own incompatible API. jsnoslqc provides:

- **One API across databases.** Switch from MongoDB to DynamoDB by changing a URL string
- **Chainable filter builder.** `Filter.where('age').gt(18).and('status').eq('active')` — no raw query objects, no vendor-specific syntax
- **Driver auto-registration.** Import a driver package and it registers itself — no manual setup
- **All-async.** Every operation returns a `Promise`, idiomatic `async`/`await` throughout
- **Async iteration.** Cursors support `for await...of` natively

## Packages

| Package | Description | Backend |
|---|---|---|
| [`@alt-javascript/jsnoslqc-core`](packages/core/) | Interfaces: Driver, Client, Collection, Cursor, Filter, DriverManager | Any |
| [`@alt-javascript/jsnoslqc-memory`](packages/memory/) | In-memory driver — zero dependencies, for testing and dev | In-process |
| [`@alt-javascript/jsnoslqc-mongodb`](packages/mongodb/) | MongoDB driver via [mongodb](https://www.npmjs.com/package/mongodb) | MongoDB |
| [`@alt-javascript/jsnoslqc-dynamodb`](packages/dynamodb/) | DynamoDB driver via [@aws-sdk/client-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb) | AWS DynamoDB |

## Quick Start: In-Memory Driver

```bash
npm install @alt-javascript/jsnoslqc-core @alt-javascript/jsnoslqc-memory
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnoslqc-core';
import '@alt-javascript/jsnoslqc-memory'; // self-registers

const client = await DriverManager.getClient('jsnoslqc:memory:');
const users = client.getCollection('users');

// Key-value ops
await users.store('u1', { name: 'Alice', age: 30, status: 'active' });
await users.store('u2', { name: 'Bob', age: 25, status: 'inactive' });

const alice = await users.get('u1');   // { name: 'Alice', age: 30, status: 'active' }
await users.delete('u2');

// Insert (auto-generated id)
const id = await users.insert({ name: 'Charlie', age: 35, status: 'active' });
const charlie = await users.get(id);

// Patch update (non-destructive)
await users.update('u1', { age: 31 });

// Find with filter
const filter = Filter.where('status').eq('active').and('age').gt(25).build();
const cursor = await users.find(filter);

// Cursor iteration options:
const docs = cursor.getDocuments(); // all at once
// or:
for await (const doc of cursor) {
  console.log(doc.name);
}

await client.close();
```

## Quick Start: MongoDB Driver

```bash
npm install @alt-javascript/jsnoslqc-core @alt-javascript/jsnoslqc-mongodb
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnoslqc-core';
import '@alt-javascript/jsnoslqc-mongodb'; // self-registers

const client = await DriverManager.getClient('jsnoslqc:mongodb://localhost:27017/myapp');
const products = client.getCollection('products');

await products.store('p1', { name: 'Widget', price: 9.99, tags: ['sale', 'new'] });

const filter = Filter.where('price').lt(20).and('tags').contains('sale').build();
const cursor = await products.find(filter);
const onSale = cursor.getDocuments();

await client.close();
```

## Quick Start: DynamoDB Driver

```bash
npm install @alt-javascript/jsnoslqc-core @alt-javascript/jsnoslqc-dynamodb
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnoslqc-core';
import '@alt-javascript/jsnoslqc-dynamodb'; // self-registers

// Real AWS DynamoDB (uses AWS SDK credential chain — env vars, ~/.aws/credentials, etc.)
const client = await DriverManager.getClient('jsnoslqc:dynamodb:us-east-1');

// DynamoDB Local (for development/testing)
const localClient = await DriverManager.getClient('jsnoslqc:dynamodb:us-east-1', {
  endpoint: 'http://localhost:8000',
  accessKeyId: 'local',
  secretAccessKey: 'local',
});

const orders = localClient.getCollection('orders');  // table created automatically

await orders.store('order-1', { customerId: 'c1', total: 99.50, status: 'pending' });
await orders.insert({ customerId: 'c2', total: 45.00, status: 'shipped' });

const filter = Filter.where('status').eq('pending').and('total').gt(50).build();
const cursor = await orders.find(filter);
const pendingOrders = cursor.getDocuments();

await localClient.close();
```

## Filter Operators

| Operator | Example | Description |
|---|---|---|
| `eq` | `.eq('Alice')` | Equal |
| `ne` | `.ne('inactive')` | Not equal |
| `gt` | `.gt(18)` | Greater than |
| `gte` | `.gte(18)` | Greater than or equal |
| `lt` | `.lt(100)` | Less than |
| `lte` | `.lte(100)` | Less than or equal |
| `contains` | `.contains('js')` | Array contains element, or string contains substring |
| `in` | `.in(['a', 'b', 'c'])` | Field is one of the values |
| `nin` | `.nin(['x', 'y'])` | Field is not one of the values |
| `exists` | `.exists(true)` | Field is present (true) or absent (false) |

Compound filters: chain multiple conditions with `.and(field)`:

```javascript
Filter.where('age').gt(18)
  .and('status').eq('active')
  .and('country').eq('AU')
  .build()
```

## jsnoslqc URL Scheme

```
jsnoslqc:<subprotocol>:<connection-details>
```

| URL | Driver |
|---|---|
| `jsnoslqc:memory:` | In-memory (no connection) |
| `jsnoslqc:mongodb://host:port/database` | MongoDB |
| `jsnoslqc:dynamodb:us-east-1` | AWS DynamoDB |

## Running Tests

```bash
npm install

# CI-safe — core + memory, no external dependencies
npm test

# Integration — requires MongoDB and DynamoDB Local (or real AWS)
npm run test:integration

# Start local services via Docker
docker run --rm -d -p 27017:27017 mongo:7
docker run --rm -d -p 8000:8000 amazon/dynamodb-local:latest
```

## Writing a jsnoslqc Driver

See [packages/memory](packages/memory/) for a complete minimal example. The pattern:

1. Extend `Driver`, implement `acceptsURL(url)` and `connect(url, props): Promise<Client>`
2. Extend `Client`, implement `_getCollection(name): Collection` and `_close()`
3. Extend `Collection`, implement `_get`, `_store`, `_delete`, `_insert`, `_update`, `_find`
4. At the bottom of your driver file: `DriverManager.registerDriver(new MyDriver())`

Run `runCompliance(clientFactory)` from `@alt-javascript/jsnoslqc-core/test/driverCompliance.js` to verify your driver against the full compliance suite.

## License

MIT
