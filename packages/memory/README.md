# @alt-javascript/jsnosqlc-memory

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnosqlc-memory)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-memory)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)

In-memory JSNOSLQC driver. Zero external dependencies. No server required. Ideal for unit tests and local development.

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-memory
```

## Usage

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-memory'; // self-registers with DriverManager

const client = await DriverManager.getClient('jsnosqlc:memory:');
const users = client.getCollection('users');

// Store and retrieve by key
await users.store('u1', { name: 'Alice', age: 30, tags: ['admin'] });
const alice = await users.get('u1'); // { name: 'Alice', age: 30, tags: ['admin'] }

// Insert with auto-assigned id
const id = await users.insert({ name: 'Bob', age: 25 });
const bob = await users.get(id);

// Patch specific fields
await users.update('u1', { age: 31 }); // name and tags preserved

// Query with filter
const filter = Filter.where('age').gt(25).and('tags').contains('admin').build();
const cursor = await users.find(filter);
const admins = cursor.getDocuments(); // [{ name: 'Alice', age: 31, tags: ['admin'] }]

// Async iteration
for await (const user of await users.find(Filter.where('age').gte(18).build())) {
  console.log(user.name);
}

await client.close();
```

## URL

```
jsnosqlc:memory:
```

Each call to `DriverManager.getClient('jsnosqlc:memory:')` creates an independent in-memory store. Collections are isolated per client instance.

## ClientDataSource

```javascript
import { ClientDataSource } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-memory';

const ds = new ClientDataSource({ url: 'jsnosqlc:memory:' });
const client = await ds.getClient();
```

## When to Use

- **Unit tests** — isolate business logic from external services with no setup
- **Local development** — stand up the application without a running database
- **Demos and prototypes** — no infrastructure required
- **Driver development** — use as reference for implementing a new JSNOSLQC driver

## Supported Operations

All six Collection operations are supported: `get`, `store`, `delete`, `insert`, `update`, `find`.

All ten Filter operators are supported: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`, `exists`.

Compound operators: `Filter.or()` and `.not()` are supported.

## License

MIT
