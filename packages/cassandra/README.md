# @alt-javascript/jsnosqlc-cassandra

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnoslqc-cassandra)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-cassandra)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)

JSNOSLQC driver for Apache Cassandra via the official [cassandra-driver](https://www.npmjs.com/package/cassandra-driver).

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-cassandra
```

## Usage

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-cassandra'; // self-registers with DriverManager

// Keyspace created automatically (SimpleStrategy, replication_factor: 1)
const client = await DriverManager.getClient('jsnoslqc:cassandra:localhost:9042/myapp');
const metrics = client.getCollection('metrics');

// Store and retrieve
await metrics.store('m1', { type: 'cpu', value: 72.5, host: 'web-01' });
const m = await metrics.get('m1');

// Insert with auto-assigned id
const id = await metrics.insert({ type: 'memory', value: 55.0, host: 'web-02' });

// Patch specific fields
await metrics.update('m1', { value: 68.3 });

// Query — full table scan + in-memory filter (see note below)
const filter = Filter.where('type').eq('cpu').and('value').gt(70).build();
const cursor = await metrics.find(filter);
const highCpu = cursor.getDocuments();

await client.close();
```

> ⚠ **`find()` performs a full table scan** for non-primary-key queries. All documents are
> fetched via `SELECT *` and filtered in-memory. This is suitable for small datasets and
> development. For production access patterns, model your Cassandra tables to support your
> queries natively with appropriate partition keys and clustering columns.

## URL Scheme

```
jsnoslqc:cassandra:<host>:<port>/<keyspace>
```

| URL | Description |
|---|---|
| `jsnoslqc:cassandra:localhost:9042/myapp` | Local Cassandra, keyspace `myapp` |
| `jsnoslqc:cassandra:cassandra.example.com:9042/prod` | Remote Cassandra |

## Connection Properties

| Property | Description |
|---|---|
| `contactPoints` | Array of contact points (overrides URL host) |
| `localDataCenter` | Local data centre name (default: `datacenter1`) |

```javascript
const client = await DriverManager.getClient(
  'jsnoslqc:cassandra:localhost:9042/myapp',
  { localDataCenter: 'DC1' }
);
```

## Schema

Each collection maps to a Cassandra table created automatically:

```cql
CREATE TABLE IF NOT EXISTS "<collection>" (
  pk   text PRIMARY KEY,
  data text
)
```

Documents are stored as JSON in the `data` column. The `pk` column holds the document key.

## Keyspace Management

The keyspace is created automatically with `SimpleStrategy` and `replication_factor: 1`. This is appropriate for local and development use. For production, create the keyspace manually with your desired replication strategy before connecting:

```cql
CREATE KEYSPACE myapp
  WITH replication = {
    'class': 'NetworkTopologyStrategy',
    'DC1': 3
  };
```

## Local Development with Docker

Cassandra takes approximately 30–60 seconds to become ready after container start.

```bash
docker run --rm -d -p 9042:9042 cassandra:4

# Wait for Cassandra to be ready before connecting
docker exec <container_id> nodetool status
```

## License

MIT
