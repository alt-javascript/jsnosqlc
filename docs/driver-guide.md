# Driver Guide

This guide explains how to implement a JSNOSLQC driver for any NoSQL backend. A driver is four classes: `Driver`, `Client`, `Collection`, and (optionally) a filter translator.

## Architecture

```
DriverManager
  └── Your Driver     (registered on import, routes URLs)
        └── Your Client   (session lifecycle)
              └── Your Collection  (CRUD + query operations)
                    └── Your FilterTranslator  (AST → native query)
```

JSNOSLQC core provides abstract base classes. Your driver extends them and overrides the `_`-prefixed methods.

## Step 1: Implement the Driver

The `Driver` class declares which URLs it handles and creates clients.

```javascript
import { Driver, DriverManager } from '@alt-javascript/jsnosqlc-core';
import MyDbClient from './MyDbClient.js';
import { MyNativeClient } from 'my-native-sdk';

export default class MyDriver extends Driver {
  // Match URLs starting with 'jsnoslqc:mydb:'
  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith('jsnoslqc:mydb:');
  }

  async connect(url, properties = {}) {
    // Parse connection details from the URL
    const nativeUrl = url.substring('jsnoslqc:mydb:'.length);
    const nativeClient = new MyNativeClient({ url: nativeUrl, ...properties });
    await nativeClient.connect();
    return new MyDbClient(url, nativeClient);
  }
}

// Self-register — runs when the package is imported
const _driver = new MyDriver();
DriverManager.registerDriver(_driver);
export { _driver };
```

**Key contract:**

| Method | Return type | Description |
|---|---|---|
| `acceptsURL(url)` | `boolean` | Return `true` if this driver handles the given URL |
| `connect(url, props)` | `Promise<Client>` | Create and return a connected Client |

## Step 2: Implement the Client

Extend `Client` and override two methods.

```javascript
import { Client } from '@alt-javascript/jsnosqlc-core';
import MyDbCollection from './MyDbCollection.js';

export default class MyDbClient extends Client {
  constructor(url, nativeClient) {
    super({ url });
    this._nativeClient = nativeClient;
  }

  // Return a new Collection instance for the given name
  _getCollection(name) {
    return new MyDbCollection(this, name, this._nativeClient);
  }

  // Close the native connection
  async _close() {
    await this._nativeClient.disconnect();
  }
}
```

**Required overrides:**

| Method | Description |
|---|---|
| `_getCollection(name)` | Return a new Collection bound to this client |
| `_close()` | Close the native connection |

The base class handles caching (`getCollection()` returns the same instance on repeated calls with the same name), lifecycle (`isClosed()`, `getUrl()`), and error checking.

## Step 3: Implement the Collection

Extend `Collection` and override the six `_`-prefixed operation methods.

```javascript
import { Collection, Cursor } from '@alt-javascript/jsnosqlc-core';
import MyDbFilterTranslator from './MyDbFilterTranslator.js';

export default class MyDbCollection extends Collection {
  constructor(client, name, nativeClient) {
    super(client, name);
    this._db = nativeClient;
  }

  async _get(key) {
    const doc = await this._db.findOne({ id: key });
    return doc ?? null;
  }

  async _store(key, doc) {
    await this._db.upsert({ id: key, ...doc });
  }

  async _delete(key) {
    await this._db.remove({ id: key });
  }

  async _insert(doc) {
    const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
    await this._db.insert({ id, ...doc, _id: id });
    return id;
  }

  async _update(key, patch) {
    const existing = await this._get(key);
    if (!existing) throw new Error(`Document not found: ${key}`);
    await this._db.upsert({ ...existing, ...patch, id: key });
  }

  async _find(ast) {
    const nativeQuery = MyDbFilterTranslator.translate(ast);
    const docs = await this._db.query(nativeQuery);
    return new Cursor(docs);
  }
}
```

**Required overrides:**

| Method | Signature | Description |
|---|---|---|
| `_get(key)` | `(key: string) → Promise<Object\|null>` | Return document or null |
| `_store(key, doc)` | `(key: string, doc: Object) → Promise<void>` | Upsert |
| `_delete(key)` | `(key: string) → Promise<void>` | Delete (no-op if missing) |
| `_insert(doc)` | `(doc: Object) → Promise<string>` | Insert, return assigned key |
| `_update(key, patch)` | `(key: string, patch: Object) → Promise<void>` | Partial update |
| `_find(ast)` | `(ast: Object) → Promise<Cursor>` | Query, return Cursor |

The base class handles the `_closed` check, the `getName()` accessor, and delegation from the public methods.

### String IDs for insert()

All built-in drivers use the same id generation pattern for consistency:

```javascript
const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
```

This produces string ids like `195b3a0f1a_a4c72f8b` — short, sortable, and collision-resistant for typical workloads.

## Step 4: Implement the Filter Translator

Translate the Filter AST to your backend's native query syntax.

### AST Node Types

```javascript
// Leaf
{ type: 'condition', field: 'age', op: 'gt', value: 18 }

// AND compound
{ type: 'and', conditions: [ /* leaf nodes */ ] }

// OR compound
{ type: 'or', conditions: [ /* leaf nodes */ ] }

// NOT
{ type: 'not', condition: /* any node */ }
```

### Operator values

`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`, `exists`

### Example: SQL-style translator

```javascript
export default class MyDbFilterTranslator {
  static translate(ast) {
    if (!ast) return null;
    return MyDbFilterTranslator._node(ast);
  }

  static _node(node) {
    switch (node.type) {
      case 'condition': return MyDbFilterTranslator._condition(node);
      case 'and': return node.conditions.map(MyDbFilterTranslator._node).join(' AND ');
      case 'or': return '(' + node.conditions.map(MyDbFilterTranslator._node).join(' OR ') + ')';
      case 'not': return 'NOT (' + MyDbFilterTranslator._node(node.condition) + ')';
      default: throw new Error(`Unknown AST node type: ${node.type}`);
    }
  }

  static _condition({ field, op, value }) {
    switch (op) {
      case 'eq': return `${field} = ${JSON.stringify(value)}`;
      case 'ne': return `${field} != ${JSON.stringify(value)}`;
      case 'gt': return `${field} > ${value}`;
      case 'gte': return `${field} >= ${value}`;
      case 'lt': return `${field} < ${value}`;
      case 'lte': return `${field} <= ${value}`;
      case 'in': return `${field} IN (${value.map(v => JSON.stringify(v)).join(', ')})`;
      case 'nin': return `${field} NOT IN (${value.map(v => JSON.stringify(v)).join(', ')})`;
      case 'exists': return value ? `${field} IS NOT NULL` : `${field} IS NULL`;
      case 'contains': return `CONTAINS(${field}, ${JSON.stringify(value)})`;
      default: throw new Error(`Unknown operator: ${op}`);
    }
  }
}
```

### In-memory fallback

For operators your backend doesn't support natively, use `MemoryFilterEvaluator` as a client-side fallback:

```javascript
import MemoryFilterEvaluator from '@alt-javascript/jsnosqlc-memory/MemoryFilterEvaluator.js';

// In _find():
const allDocs = await this._db.fetchAll();
const filtered = allDocs.filter(doc => MemoryFilterEvaluator.matches(doc, ast));
return new Cursor(filtered);
```

## Step 5: Package and Export

```javascript
// index.js
export { default as MyDriver, MyDbClient, _driver } from './MyDriver.js';
export { default as MyDbCollection } from './MyDbCollection.js';
export { default as MyDbFilterTranslator } from './MyDbFilterTranslator.js';
```

The import of `MyDriver.js` triggers `DriverManager.registerDriver()`. Users write:

```javascript
import '@alt-javascript/jsnosqlc-mydb'; // self-registers
```

## Step 6: Run the Compliance Suite

Use the shared compliance suite to verify your driver passes all standard behaviours:

```javascript
import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnosqlc-core';
import MyDriver from '../MyDriver.js';

describe('My driver compliance', function () {
  runCompliance(async () => {
    DriverManager.clear();
    DriverManager.registerDriver(new MyDriver());
    return DriverManager.getClient('jsnoslqc:mydb:...');
  });
});
```

The compliance suite runs 25 tests covering all six collection operations and the ten filter operators. All 25 must pass before considering your driver production-ready.

## Package Conventions

Follow these conventions to be consistent with the built-in drivers:

| Convention | Value |
|---|---|
| Package name | `@<scope>/jsnoslqc-<subprotocol>` |
| URL prefix | `jsnoslqc:<subprotocol>:` |
| ESM | `"type": "module"` in `package.json` |
| Self-register | `DriverManager.registerDriver(new MyDriver())` at module level |
| String IDs | `Date.now().toString(16)_Math.random()...` |
| Graceful skip | Skip tests (not fail) when the backend is unreachable |

## Reference Implementations

All built-in drivers are open source and good reading:

| Driver | Notable technique |
|---|---|
| [`jsnoslqc-memory`](../packages/memory/) | Simplest possible implementation — start here |
| [`jsnoslqc-mongodb`](../packages/mongodb/) | Native query translation |
| [`jsnoslqc-dynamodb`](../packages/dynamodb/) | Auto-table creation, DynamoDB expression builder |
| [`jsnoslqc-firestore`](../packages/firestore/) | Native SDK filter chaining + partial client-side fallback |
| [`jsnoslqc-cosmosdb`](../packages/cosmosdb/) | Parameterised SQL query construction |
| [`jsnoslqc-redis`](../packages/redis/) | Secondary key index for collection scan |
| [`jsnoslqc-cassandra`](../packages/cassandra/) | JSON-column schema, full table scan + client-side filter |
