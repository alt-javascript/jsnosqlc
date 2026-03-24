# @alt-javascript/jsnoslqc-dynamodb

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnoslqc-dynamodb)](https://www.npmjs.com/package/@alt-javascript/jsnoslqc-dynamodb)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnoslqc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnoslqc/actions/workflows/node.js.yml)

JSNOSLQC driver for AWS DynamoDB via the [@aws-sdk/client-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb) v3 SDK.

**Part of the [@alt-javascript/jsnoslqc](https://github.com/alt-javascript/jsnoslqc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnoslqc-core @alt-javascript/jsnoslqc-dynamodb
```

## Usage

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnoslqc-core';
import '@alt-javascript/jsnoslqc-dynamodb'; // self-registers with DriverManager

// Local DynamoDB (DynamoDB Local)
const client = await DriverManager.getClient('jsnoslqc:dynamodb:us-east-1', {
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

// AWS production — uses standard AWS credential chain
const client = await DriverManager.getClient('jsnoslqc:dynamodb:us-east-1');

const orders = client.getCollection('orders');

await orders.store('ord-001', { customerId: 'c1', amount: 59.99, status: 'pending' });
const order = await orders.get('ord-001');

const id = await orders.insert({ customerId: 'c2', amount: 120.00, status: 'shipped' });
await orders.update(id, { status: 'delivered' });

const filter = Filter.where('status').eq('pending').build();
const cursor = await orders.find(filter);
const pending = cursor.getDocuments();

await client.close();
```

## URL Scheme

```
jsnoslqc:dynamodb:<region>
```

| URL | Description |
|---|---|
| `jsnoslqc:dynamodb:us-east-1` | AWS DynamoDB in us-east-1 |
| `jsnoslqc:dynamodb:eu-west-1` | AWS DynamoDB in eu-west-1 |

## Connection Properties

| Property | Description |
|---|---|
| `endpoint` | Override endpoint URL (for DynamoDB Local or LocalStack) |
| `credentials` | `{ accessKeyId, secretAccessKey }` (falls back to standard AWS credential chain) |

```javascript
const client = await DriverManager.getClient('jsnoslqc:dynamodb:us-east-1', {
  endpoint: process.env.DYNAMODB_ENDPOINT, // e.g. 'http://localhost:8000'
});
```

## Table Management

Tables are created automatically when a collection is first used. Each collection maps to a DynamoDB table with a single String hash key named `pk`.

To use an existing table, ensure it has `pk` (String) as its partition key.

## Local Development with Docker

```bash
docker run --rm -d -p 8000:8000 amazon/dynamodb-local:latest
export DYNAMODB_ENDPOINT=http://localhost:8000
```

```javascript
const client = await DriverManager.getClient('jsnoslqc:dynamodb:us-east-1', {
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});
```

## Filter Translation

DynamoDB uses FilterExpressions for Scan operations. The driver translates the JSNOSLQC AST:

| JSNOSLQC | DynamoDB FilterExpression |
|---|---|
| `eq` | `#field = :val` |
| `ne` | `#field <> :val` |
| `gt` / `gte` | `#field > / >= :val` |
| `lt` / `lte` | `#field < / <= :val` |
| `contains` | `contains(#field, :val)` |
| `in` | `(#field = :v0 OR #field = :v1 ...)` |
| `nin` | `(#field <> :v0 AND #field <> :v1 ...)` |
| `exists` (true) | `attribute_exists(#field)` |
| `exists` (false) | `attribute_not_exists(#field)` |
| `and` | `(expr AND expr)` |
| `or` | `(expr OR expr)` |
| `not` | `NOT (expr)` |

All `find()` calls use DynamoDB `Scan` with a FilterExpression. For large tables, add a secondary index and query by index key for production use cases.

## License

MIT
