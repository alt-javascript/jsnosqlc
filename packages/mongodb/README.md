# @alt-javascript/jsnosqlc-mongodb

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnosqlc-mongodb)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-mongodb)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)

JSNOSLQC driver for MongoDB via the official [mongodb](https://www.npmjs.com/package/mongodb) Node.js driver.

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-mongodb
```

## Usage

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-mongodb'; // self-registers with DriverManager

const client = await DriverManager.getClient('jsnosqlc:mongodb://localhost:27017/mydb');
const products = client.getCollection('products');

// Store and retrieve
await products.store('p1', { name: 'Widget', price: 9.99, tags: ['hardware'] });
const p = await products.get('p1'); // { name: 'Widget', price: 9.99, tags: ['hardware'] }

// Insert with auto-assigned id
const id = await products.insert({ name: 'Gadget', price: 24.99 });
await products.update(id, { price: 19.99 }); // partial update — other fields preserved

// Query
const filter = Filter.where('price').lt(15).and('tags').contains('hardware').build();
const cursor = await products.find(filter);
for await (const doc of cursor) {
  console.log(doc.name, doc.price);
}

await client.close();
```

## URL Scheme

```
jsnosqlc:mongodb://<host>:<port>/<database>
```

| URL | Description |
|---|---|
| `jsnosqlc:mongodb://localhost:27017/mydb` | Local MongoDB |
| `jsnosqlc:mongodb://user:pass@host:27017/mydb` | With credentials |
| `jsnosqlc:mongodb+srv://cluster.mongodb.net/mydb` | MongoDB Atlas |

## Connection Properties

Pass additional options as the second argument to `DriverManager.getClient()`:

```javascript
const client = await DriverManager.getClient(
  'jsnosqlc:mongodb://localhost:27017/mydb',
  { maxPoolSize: 10, connectTimeoutMS: 5000 }
);
```

Properties are passed directly to the underlying `MongoClient` options.

## ClientDataSource

```javascript
import { ClientDataSource } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-mongodb';

const ds = new ClientDataSource({
  url: 'jsnosqlc:mongodb://localhost:27017/mydb',
  username: 'user',
  password: 'pass',
});
const client = await ds.getClient();
```

## Local Development with Docker

```bash
docker run --rm -d -p 27017:27017 mongo:7
```

## Filter Translation

The MongoDB driver translates the JSNOSLQC Filter AST to native MongoDB query operators:

| JSNOSLQC | MongoDB |
|---|---|
| `eq` | `{ field: value }` |
| `ne` | `{ field: { $ne: value } }` |
| `gt` / `gte` | `{ field: { $gt/$gte: value } }` |
| `lt` / `lte` | `{ field: { $lt/$lte: value } }` |
| `contains` | `{ field: value }` (native array element match) |
| `in` | `{ field: { $in: [...] } }` |
| `nin` | `{ field: { $nin: [...] } }` |
| `exists` | `{ field: { $exists: bool } }` |
| `and` | `{ $and: [...] }` |
| `or` | `{ $or: [...] }` |
| `not` | `{ $nor: [cond] }` |

## License

MIT
