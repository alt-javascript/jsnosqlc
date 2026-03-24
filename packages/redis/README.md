# @alt-javascript/jsnosqlc-redis

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnosqlc-redis)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-redis)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)

JSNOSLQC driver for Redis via [ioredis](https://www.npmjs.com/package/ioredis).

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-redis
```

## Usage

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-redis'; // self-registers with DriverManager

const client = await DriverManager.getClient('jsnosqlc:redis://localhost:6379');
const sessions = client.getCollection('sessions');

// Store and retrieve
await sessions.store('sess-1', { userId: 'u1', token: 'abc123', active: true });
const sess = await sessions.get('sess-1');

// Insert with auto-assigned id
const id = await sessions.insert({ userId: 'u2', token: 'xyz789', active: true });

// Patch specific fields
await sessions.update('sess-1', { active: false });

// Query — full collection scan + in-memory filter (see note below)
const filter = Filter.where('active').eq(true).build();
const cursor = await sessions.find(filter);
const active = cursor.getDocuments();

await client.close();
```

> ⚠ **`find()` performs a full collection scan.** All documents in the collection are fetched
> and filtered in-memory. This is suitable for small datasets and development. For production
> filter queries, use [RediSearch](https://redis.io/docs/stack/search/).

## URL Scheme

```
jsnosqlc:redis://<host>:<port>[/<db>]
```

| URL | Description |
|---|---|
| `jsnosqlc:redis://localhost:6379` | Default database (0) |
| `jsnosqlc:redis://localhost:6379/1` | Database index 1 |
| `jsnosqlc:redis://:password@host:6379` | With password |

The `jsnosqlc:` prefix is stripped and the remainder is passed to ioredis.

## Storage Layout

Documents are stored as JSON strings under namespaced keys:

```
jsnosqlc:<collection>:<key>    → JSON string (document)
jsnosqlc:<collection>:_keys    → Redis Set (index of all keys in collection)
```

The `_keys` Set enables `find()` to fetch all collection documents without a global `SCAN`.

## ClientDataSource

```javascript
import { ClientDataSource } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-redis';

const ds = new ClientDataSource({
  url: 'jsnosqlc:redis://localhost:6379',
  properties: { connectTimeout: 5000 },
});
const client = await ds.getClient();
```

## Local Development with Docker

```bash
docker run --rm -d -p 6379:6379 redis:7
```

## When to Use Redis as a Document Store

Redis is primarily a key-value and cache store. The JSNOSLQC Redis driver adds a thin document abstraction:

- **Suitable for:** session state, ephemeral document storage, small collections where key-based access dominates
- **Not suitable for:** large collections with complex filter queries, analytics, or data that outlives a Redis restart without persistence enabled

## License

MIT
