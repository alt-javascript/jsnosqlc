# @alt-javascript/jsnosqlc-cosmosdb

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnoslqc-cosmosdb)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-cosmosdb)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)

JSNOSLQC driver for Azure Cosmos DB (NoSQL API) via the [@azure/cosmos](https://www.npmjs.com/package/@azure/cosmos) SDK.

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-cosmosdb
```

## Usage

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-cosmosdb'; // self-registers with DriverManager

// Local emulator (vnext-preview — serves HTTP on port 8081)
const client = await DriverManager.getClient('jsnoslqc:cosmosdb:local');

// Azure production
const client = await DriverManager.getClient(
  'jsnoslqc:cosmosdb:https://myaccount.documents.azure.com:443/',
  {
    key: process.env.COSMOS_KEY,
    database: 'myapp',
  }
);

const items = client.getCollection('items');

await items.store('i1', { name: 'Widget', category: 'tools', price: 9.99 });
const item = await items.get('i1');

const id = await items.insert({ name: 'Gadget', category: 'electronics', price: 49.99 });
await items.update(id, { price: 44.99 });

const filter = Filter.where('category').eq('tools').and('price').lt(15).build();
const cursor = await items.find(filter);
const tools = cursor.getDocuments();

await client.close();
```

## URL Scheme

```
jsnoslqc:cosmosdb:<endpoint-or-local>
```

| URL | Description |
|---|---|
| `jsnoslqc:cosmosdb:local` | Local emulator (`http://localhost:8081`) |
| `jsnoslqc:cosmosdb:https://account.documents.azure.com:443/` | Azure production |

## Connection Properties

| Property | Description |
|---|---|
| `key` | Cosmos DB account key (required for non-emulator) |
| `database` | Database name (default: `jsnoslqc`) |
| `endpoint` | Override emulator endpoint (default: `http://localhost:8081`) |

## Database and Container Management

Databases and containers are created automatically on first use:

- **Database:** created with `createIfNotExists` (default name: `jsnoslqc`)
- **Container:** created with `createIfNotExists`, partition key `{ paths: ['/id'], kind: 'Hash' }`

## Local Development with Docker

The vnext-preview emulator serves HTTP (not HTTPS) on port 8081:

```bash
docker run --rm -d \
  -p 8081:8081 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
```

Wait ~30 seconds for the emulator to become ready, then connect with `jsnoslqc:cosmosdb:local`.

> **Note:** The vnext-preview emulator defaults to HTTP. The older Linux emulator uses HTTPS with a
> self-signed certificate. This driver targets vnext-preview.

## Filter Translation

Filters are translated to Cosmos DB SQL (`SELECT * FROM c WHERE ...`):

| JSNOSLQC | Cosmos DB SQL |
|---|---|
| `eq` | `c.field = @p0` |
| `ne` | `c.field != @p0` |
| `gt` / `gte` | `c.field > / >= @p0` |
| `lt` / `lte` | `c.field < / <= @p0` |
| `contains` | `ARRAY_CONTAINS(c.field, @p0)` or `CONTAINS(c.field, @p0)` |
| `in` | `c.field IN (@p0, @p1, ...)` |
| `nin` | `NOT (c.field IN (@p0, @p1, ...))` |
| `exists` (true) | `IS_DEFINED(c.field)` |
| `exists` (false) | `NOT IS_DEFINED(c.field)` |
| `and` | `(expr AND expr)` |
| `or` | `(expr OR expr)` |
| `not` | `NOT (expr)` |

## License

MIT
