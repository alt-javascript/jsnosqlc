# API Reference

Complete reference for all JSNOSLQC interfaces. All operations are async and return Promises unless stated otherwise.

---

## DriverManager

Static registry that routes connection requests to registered drivers.

### `DriverManager.getClient(url [, properties])`

Returns a `Client` from the first registered driver that accepts the URL.

```javascript
import { DriverManager } from '@alt-javascript/jsnoslqc-core';

const client = await DriverManager.getClient('jsnoslqc:memory:');
const client = await DriverManager.getClient('jsnoslqc:mongodb://localhost:27017/mydb');
const client = await DriverManager.getClient('jsnoslqc:dynamodb:us-east-1', {
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | A `jsnoslqc:` URL |
| `properties` | `Object` | No | Driver-specific connection properties |

**Throws:** `Error` if no registered driver accepts the URL.

### `DriverManager.registerDriver(driver)`

Register a driver instance. Drivers self-register on import — manual registration is only needed in tests.

### `DriverManager.deregisterDriver(driver)`

Remove a previously registered driver.

### `DriverManager.clear()`

Remove all registered drivers. Useful for test isolation.

### `DriverManager.getDrivers()`

Return a shallow copy of the registered drivers array.

---

## ClientDataSource

Convenience factory that encapsulates connection configuration. Mirrors the `DataSource` pattern from [jsdbc](https://github.com/alt-javascript/jsdbc).

```javascript
import { ClientDataSource } from '@alt-javascript/jsnoslqc-core';
import '@alt-javascript/jsnoslqc-memory';

const ds = new ClientDataSource({ url: 'jsnoslqc:memory:' });
const client = await ds.getClient();
```

### Constructor

| Property | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | jsnoslqc URL |
| `username` | `string` | No | Passed to driver as a property |
| `password` | `string` | No | Passed to driver as a property |
| `properties` | `Object` | No | Additional driver-specific properties |

### `ds.getClient()`

Returns `Promise<Client>`. Calls `DriverManager.getClient(url, properties)`.

---

## Client

Represents a session with a database. Obtained from `DriverManager.getClient()` or `ClientDataSource.getClient()`.

### `client.getCollection(name)`

Returns a `Collection` for the named collection. Returns a cached instance on subsequent calls with the same name.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Collection name |

**Throws:** `Error` if the client is closed.

### `client.close()`

Returns `Promise<void>`. Closes the client, clears the collection cache, and releases underlying resources.

### `client.isClosed()`

Returns `boolean`. `true` after `close()` has been called.

### `client.getUrl()`

Returns the `jsnoslqc:` URL string this client was opened with.

---

## Collection

Represents a named collection, table, or bucket. Obtained via `client.getCollection(name)`.

### `collection.get(key)`

Returns `Promise<Object|null>`. Retrieve a document by its primary key. Returns `null` if no document exists for the key.

```javascript
const doc = await col.get('order-001');
if (doc === null) console.log('Not found');
```

### `collection.store(key, doc)`

Returns `Promise<void>`. Upsert a document under the given key. Creates a new document or replaces an existing one entirely.

```javascript
await col.store('order-001', { customerId: 'c1', total: 59.99, status: 'pending' });
```

### `collection.delete(key)`

Returns `Promise<void>`. Delete a document by its primary key. No-op if the document does not exist.

```javascript
await col.delete('order-001');
```

### `collection.insert(doc)`

Returns `Promise<string>`. Insert a document and let the backend assign a unique key. Returns the assigned key (a string in all drivers).

```javascript
const id = await col.insert({ customerId: 'c2', total: 120.00, status: 'new' });
const doc = await col.get(id);
```

The assigned id is also set as `doc._id` in the stored document.

### `collection.update(key, patch)`

Returns `Promise<void>`. Partially update an existing document. Only the fields present in `patch` are updated; all other fields are preserved.

```javascript
await col.update('order-001', { status: 'shipped' });
// 'customerId' and 'total' are unchanged
```

**Throws:** `Error` if no document exists for the key.

### `collection.find(filter)`

Returns `Promise<Cursor>`. Query the collection using a filter built with the `Filter` builder.

```javascript
const filter = Filter.where('status').eq('pending').build();
const cursor = await col.find(filter);
```

Pass `null` or an empty filter AST to retrieve all documents:

```javascript
const cursor = await col.find(null);
const all = cursor.getDocuments();
```

### `collection.getName()`

Returns the collection name string.

---

## Cursor

Holds the results of a `find()` call. Supports cursor-style iteration, bulk access, and the async iterator protocol.

### `cursor.next()`

Returns `Promise<boolean>`. Advance to the next document. Returns `true` if there is a document at the new position, `false` when exhausted.

### `cursor.getDocument()`

Returns `Object`. Return the document at the current cursor position. Must be called after a successful `cursor.next()`.

**Throws:** `Error` if not on a valid position.

### `cursor.getDocuments()`

Returns `Object[]`. Return all documents as a plain array without cursor iteration. Does not affect cursor position.

```javascript
const docs = cursor.getDocuments(); // returns all results immediately
```

### `cursor.close()`

Returns `Promise<void>`. Releases cursor resources. Called automatically by the async iterator.

### `cursor.isClosed()`

Returns `boolean`.

### Async Iterator

Cursors implement `Symbol.asyncIterator`:

```javascript
for await (const doc of cursor) {
  console.log(doc);
}
// cursor is closed automatically on exhaustion
```

---

## Filter

Chainable builder that constructs a filter AST. The AST is consumed by driver translators to produce native query expressions.

### `Filter.where(field)`

Static factory. Start a new filter on the given field. Returns a `FieldCondition`.

```javascript
Filter.where('age').gt(18).and('status').eq('active').build()
```

### `Filter.or(...filters)`

Static factory. Combine two or more built filter ASTs into an OR compound. Each argument should be a built AST (the return value of `.build()` or `.not()`).

```javascript
const or = Filter.or(
  Filter.where('status').eq('active').build(),
  Filter.where('status').eq('pending').build()
);
// { type: 'or', conditions: [...] }
```

### `filter.and(field)`

Chain an additional AND condition. Returns a `FieldCondition` bound to the same filter.

### `filter.not()`

Negate the current filter. Calls `build()` internally and wraps the result.

```javascript
const notActive = Filter.where('status').eq('inactive').not();
// { type: 'not', condition: { type: 'condition', field: 'status', op: 'eq', value: 'inactive' } }
```

### `filter.build()`

Produce the filter AST. Returns a single condition node for single-condition filters, or an `{ type: 'and', conditions: [...] }` node for multi-condition filters.

---

## FieldCondition Operators

`Filter.where(field)` and `filter.and(field)` return a `FieldCondition`. Call an operator method to add the condition and return the parent `Filter`.

| Method | Operator | Description |
|---|---|---|
| `.eq(value)` | `eq` | Equal |
| `.ne(value)` | `ne` | Not equal |
| `.gt(value)` | `gt` | Greater than |
| `.gte(value)` | `gte` | Greater than or equal |
| `.lt(value)` | `lt` | Less than |
| `.lte(value)` | `lte` | Less than or equal |
| `.contains(value)` | `contains` | Array element match or string substring |
| `.in(values)` | `in` | Field is one of the values (array) |
| `.nin(values)` | `nin` | Field is not one of the values (array) |
| `.exists(bool)` | `exists` | Field is present (`true`) or absent (`false`) |

---

## Filter AST

The internal representation passed to driver translators.

### Leaf node (single condition)

```javascript
{ type: 'condition', field: 'age', op: 'gt', value: 18 }
```

### AND compound

```javascript
{ type: 'and', conditions: [
  { type: 'condition', field: 'age', op: 'gt', value: 18 },
  { type: 'condition', field: 'status', op: 'eq', value: 'active' }
]}
```

### OR compound

```javascript
{ type: 'or', conditions: [
  { type: 'condition', field: 'status', op: 'eq', value: 'active' },
  { type: 'condition', field: 'status', op: 'eq', value: 'pending' }
]}
```

### NOT

```javascript
{ type: 'not', condition: { type: 'condition', field: 'status', op: 'eq', value: 'inactive' } }
```

---

## jsnoslqc URL Scheme

```
jsnoslqc:<subprotocol>:<connection-details>
```

| URL | Driver Package |
|---|---|
| `jsnoslqc:memory:` | `@alt-javascript/jsnoslqc-memory` |
| `jsnoslqc:mongodb://<host>:<port>/<db>` | `@alt-javascript/jsnoslqc-mongodb` |
| `jsnoslqc:dynamodb:<region>` | `@alt-javascript/jsnoslqc-dynamodb` |
| `jsnoslqc:firestore:<project-id>` | `@alt-javascript/jsnoslqc-firestore` |
| `jsnoslqc:cosmosdb:local` | `@alt-javascript/jsnoslqc-cosmosdb` |
| `jsnoslqc:cosmosdb:<https-endpoint>` | `@alt-javascript/jsnoslqc-cosmosdb` |
| `jsnoslqc:redis://<host>:<port>[/<db>]` | `@alt-javascript/jsnoslqc-redis` |
| `jsnoslqc:cassandra:<host>:<port>/<keyspace>` | `@alt-javascript/jsnoslqc-cassandra` |

---

## Errors

### `UnsupportedOperationError`

Thrown when a Collection method is called that the underlying driver does not support.

```javascript
import { UnsupportedOperationError } from '@alt-javascript/jsnoslqc-core';
```

All six Collection operations are supported by all eight built-in drivers.
