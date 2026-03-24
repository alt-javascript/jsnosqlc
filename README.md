# JSNOSLQC — JDBC-Inspired NoSQL Access for JavaScript

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnosqlc-core)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-core)

A uniform, async NoSQL access facade for JavaScript inspired by Java's JDBC — and by [jsdbc](https://github.com/alt-javascript/jsdbc), its SQL counterpart. Write database code once against jsnoslqc interfaces, then plug in any supported driver — in-memory, MongoDB, DynamoDB, Firestore, Cosmos DB, Redis, Cassandra, and more.

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
| [`@alt-javascript/jsnosqlc-core`](packages/core/) | Interfaces: Driver, Client, Collection, Cursor, Filter, DriverManager | Any |
| [`@alt-javascript/jsnosqlc-memory`](packages/memory/) | In-memory driver — zero dependencies, for testing and dev | In-process |
| [`@alt-javascript/jsnosqlc-mongodb`](packages/mongodb/) | MongoDB driver via [mongodb](https://www.npmjs.com/package/mongodb) | MongoDB |
| [`@alt-javascript/jsnosqlc-dynamodb`](packages/dynamodb/) | DynamoDB driver via [@aws-sdk/client-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb) | AWS DynamoDB |
| [`@alt-javascript/jsnosqlc-firestore`](packages/firestore/) | Google Firestore driver via [@google-cloud/firestore](https://www.npmjs.com/package/@google-cloud/firestore) | GCP Firestore |
| [`@alt-javascript/jsnosqlc-cosmosdb`](packages/cosmosdb/) | Azure Cosmos DB driver via [@azure/cosmos](https://www.npmjs.com/package/@azure/cosmos) | Azure Cosmos DB |
| [`@alt-javascript/jsnosqlc-redis`](packages/redis/) | Redis driver via [ioredis](https://www.npmjs.com/package/ioredis) | Redis |
| [`@alt-javascript/jsnosqlc-cassandra`](packages/cassandra/) | Apache Cassandra driver via [cassandra-driver](https://www.npmjs.com/package/cassandra-driver) | Cassandra |

## Quick Start: In-Memory Driver

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-memory
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-memory'; // self-registers

const client = await DriverManager.getClient('jsnosqlc:memory:');
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
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-mongodb
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-mongodb'; // self-registers

const client = await DriverManager.getClient('jsnosqlc:mongodb://localhost:27017/myapp');
const products = client.getCollection('products');

await products.store('p1', { name: 'Widget', price: 9.99, tags: ['sale', 'new'] });

const filter = Filter.where('price').lt(20).and('tags').contains('sale').build();
const cursor = await products.find(filter);
const onSale = cursor.getDocuments();

await client.close();
```

## Quick Start: DynamoDB Driver

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-dynamodb
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-dynamodb'; // self-registers

// Real AWS DynamoDB (uses AWS SDK credential chain — env vars, ~/.aws/credentials, etc.)
const client = await DriverManager.getClient('jsnosqlc:dynamodb:us-east-1');

// DynamoDB Local (for development/testing)
const localClient = await DriverManager.getClient('jsnosqlc:dynamodb:us-east-1', {
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

Compound filters — AND (implicit chaining):

```javascript
Filter.where('age').gt(18)
  .and('status').eq('active')
  .and('country').eq('AU')
  .build()
```

OR compound:

```javascript
Filter.or(
  Filter.where('status').eq('active').build(),
  Filter.where('status').eq('pending').build()
)
// { type: 'or', conditions: [ ...active..., ...pending... ] }
```

NOT negation:

```javascript
Filter.where('status').eq('inactive').not()
// { type: 'not', condition: { type: 'condition', field: 'status', op: 'eq', value: 'inactive' } }
```

## jsnoslqc URL Scheme

```
jsnosqlc:<subprotocol>:<connection-details>
```

| URL | Driver |
|---|---|
| `jsnosqlc:memory:` | In-memory (no connection) |
| `jsnosqlc:mongodb://host:port/database` | MongoDB |
| `jsnosqlc:dynamodb:us-east-1` | AWS DynamoDB |
| `jsnosqlc:firestore:my-gcp-project` | Google Firestore |
| `jsnosqlc:cosmosdb:local` | Azure Cosmos DB (local emulator) |
| `jsnosqlc:cosmosdb:https://account.documents.azure.com:443/` | Azure Cosmos DB (real) |
| `jsnosqlc:redis://localhost:6379` | Redis |
| `jsnosqlc:cassandra:localhost:9042/keyspace` | Apache Cassandra |

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
docker run --rm -d -e FIRESTORE_PROJECT_ID=jsnoslqc-test -e PORT=8080 -p 8080:8080 mtlynch/firestore-emulator
docker run --rm -d -p 8081:8081 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
docker run --rm -d -p 6379:6379 redis:7
docker run --rm -d -p 9042:9042 cassandra:4
```

## Quick Start: Google Firestore

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-firestore
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-firestore'; // self-registers

// Emulator — set env var before importing the driver
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Real GCP — set GOOGLE_APPLICATION_CREDENTIALS or pass keyFilename
const client = await DriverManager.getClient('jsnosqlc:firestore:my-gcp-project');
const users = client.getCollection('users');

await users.store('u1', { name: 'Alice', age: 30, tags: ['admin'] });
const filter = Filter.where('age').gt(25).and('tags').contains('admin').build();
const cursor = await users.find(filter);
const admins = cursor.getDocuments();

await client.close();
```

## Quick Start: Azure Cosmos DB

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-cosmosdb
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-cosmosdb'; // self-registers

// Local emulator (vnext-preview serves HTTP on 8081)
const client = await DriverManager.getClient('jsnosqlc:cosmosdb:local');

// Real Azure — provide your account endpoint and key
const prodClient = await DriverManager.getClient(
  'jsnosqlc:cosmosdb:https://myaccount.documents.azure.com:443/',
  { key: 'your-account-key', database: 'myapp' }
);

const items = client.getCollection('items');
await items.store('i1', { name: 'Widget', price: 9.99, category: 'tools' });

const filter = Filter.where('price').lt(20).and('category').eq('tools').build();
const cursor = await items.find(filter);
const cheap = cursor.getDocuments();

await client.close();
```

## Quick Start: Redis

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-redis
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-redis'; // self-registers

const client = await DriverManager.getClient('jsnosqlc:redis://localhost:6379');
const cache = client.getCollection('sessions');

await cache.store('sess-1', { userId: 'u1', token: 'abc123', active: true });

const filter = Filter.where('active').eq(true).build();
const cursor = await cache.find(filter); // ⚠ full scan — see docs
const activeSessions = cursor.getDocuments();

await client.close();
```

> ⚠ **Redis `find()` limitation:** The Redis driver performs a full collection scan
> and filters results in-memory. This is suitable for development and small datasets.
> For production filter queries, use [RediSearch](https://redis.io/docs/stack/search/).

## Quick Start: Apache Cassandra

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-cassandra
```

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-cassandra'; // self-registers

// Keyspace is created automatically if it doesn't exist
const client = await DriverManager.getClient('jsnosqlc:cassandra:localhost:9042/myapp');
const events = client.getCollection('events');

await events.store('evt-1', { type: 'login', userId: 'u1', score: 10 });
await events.insert({ type: 'click', userId: 'u2', score: 5 });

const filter = Filter.where('score').gt(7).build();
const cursor = await events.find(filter); // full scan + in-memory filter
const highScore = cursor.getDocuments();

await client.close();
```

> ⚠ **Cassandra `find()` limitation:** Documents are stored as JSON in a single
> column. Non-pk field filtering is done client-side after a full table scan.
> For production, model your tables to support your access patterns natively in CQL.

## Filter Operators

## Writing a jsnoslqc Driver

See the [Driver Guide](docs/driver-guide.md) and [`@alt-javascript/jsnosqlc-memory`](packages/memory/) for a complete minimal example. The pattern:

1. Extend `Driver`, implement `acceptsURL(url)` and `connect(url, props): Promise<Client>`
2. Extend `Client`, implement `_getCollection(name): Collection` and `_close()`
3. Extend `Collection`, implement `_get`, `_store`, `_delete`, `_insert`, `_update`, `_find`
4. At the bottom of your driver file: `DriverManager.registerDriver(new MyDriver())`

Run `runCompliance(clientFactory)` from `@alt-javascript/jsnosqlc-core/test/driverCompliance.js` to verify your driver against the full compliance suite.

## Documentation

- [Getting Started](docs/getting-started.md) — tutorial: first operations, switching backends
- [API Reference](docs/api-reference.md) — complete interface documentation
- [Driver Guide](docs/driver-guide.md) — writing custom jsnoslqc drivers
- [For JDBC Developers](docs/jdbc-migration.md) — mapping JDBC concepts to jsnoslqc
- [Changelog](CHANGELOG.md) — release history

## Contributing

```bash
git clone https://github.com/alt-javascript/jsnosqlc.git
cd jsnoslqc
npm install

npm test                  # CI-safe: core + memory (55 tests, no external deps)
npm run test:integration  # all drivers (requires Docker)
```

See [Driver Guide](docs/driver-guide.md) for instructions on contributing a new driver.

## License

MIT
