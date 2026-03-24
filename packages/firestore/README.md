# @alt-javascript/jsnosqlc-firestore

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsnosqlc-firestore)](https://www.npmjs.com/package/@alt-javascript/jsnosqlc-firestore)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/jsnosqlc/actions/workflows/node.js.yml)

JSNOSLQC driver for Google Cloud Firestore via the [@google-cloud/firestore](https://www.npmjs.com/package/@google-cloud/firestore) Admin SDK.

**Part of the [@alt-javascript/jsnosqlc](https://github.com/alt-javascript/jsnosqlc) monorepo.**

## Install

```bash
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-firestore
```

## Usage

```javascript
import { DriverManager, Filter } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-firestore'; // self-registers with DriverManager

// Firestore Emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const client = await DriverManager.getClient('jsnosqlc:firestore:my-project-id');

// Google Cloud Firestore (production)
// Set GOOGLE_APPLICATION_CREDENTIALS or use Application Default Credentials
const client = await DriverManager.getClient('jsnosqlc:firestore:my-project-id');

const events = client.getCollection('events');

await events.store('e1', { type: 'login', userId: 'u1', score: 100 });
const e = await events.get('e1');

const id = await events.insert({ type: 'click', userId: 'u2', score: 50 });
await events.update(id, { score: 75 });

const filter = Filter.where('score').gt(60).and('type').eq('login').build();
const cursor = await events.find(filter);
for await (const doc of cursor) {
  console.log(doc.userId, doc.score);
}

await client.close();
```

## URL Scheme

```
jsnosqlc:firestore:<gcp-project-id>
```

| URL | Description |
|---|---|
| `jsnosqlc:firestore:my-project` | Production Firestore |
| `jsnosqlc:firestore:emulator-project` | Firestore Emulator (set `FIRESTORE_EMULATOR_HOST`) |

## Authentication

Firestore uses Application Default Credentials (ADC):

- **Locally:** `gcloud auth application-default login`, or set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key file path
- **GCP (Cloud Run, GKE, etc.):** Uses the default service account automatically
- **Emulator:** Set `FIRESTORE_EMULATOR_HOST=localhost:8080` — no credentials needed

To specify a key file explicitly:

```javascript
const client = await DriverManager.getClient('jsnosqlc:firestore:my-project', {
  keyFilename: '/path/to/service-account.json',
});
```

## Local Development with Docker

```bash
docker run --rm -d \
  -e FIRESTORE_PROJECT_ID=my-project \
  -e PORT=8080 \
  -p 8080:8080 \
  mtlynch/firestore-emulator
```

Then set `FIRESTORE_EMULATOR_HOST=localhost:8080` before creating a client.

## Filter Translation

Native Firestore SDK filter queries are used for all supported operators. Unsupported operators fall back to in-memory filtering after a full collection fetch.

| JSNOSLQC | Native Firestore | Notes |
|---|---|---|
| `eq` | `.where(field, '==', val)` | Native |
| `ne` | `.where(field, '!=', val)` | Native |
| `gt` / `gte` | `.where(field, '>' / '>=', val)` | Native |
| `lt` / `lte` | `.where(field, '<' / '<=', val)` | Native |
| `contains` | `.where(field, 'array-contains', val)` | Native |
| `in` | `.where(field, 'in', [...])` | Native |
| `nin` | `.where(field, 'not-in', [...])` | Native |
| `exists` (true) | `.where(field, '!=', null)` | Approximation |
| `and` | Chained `.where()` calls | Native |
| `or` | Client-side | Firestore OR requires composite index |
| `not` | Client-side | No native NOT |

## License

MIT
