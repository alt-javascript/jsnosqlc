# For JDBC Developers

If you know Java's JDBC, most of JSNOSLQC's design will be immediately familiar. This page maps JDBC concepts to their JSNOSLQC equivalents and highlights the key differences.

## Conceptual Mapping

| JDBC | JSNOSLQC | Notes |
|---|---|---|
| `DriverManager.getConnection(url)` | `DriverManager.getClient(url)` | Same static registry pattern |
| `DataSource.getConnection()` | `ClientDataSource.getClient()` | Same factory pattern |
| `Connection` | `Client` | Manages session lifecycle |
| `Statement` / `PreparedStatement` | `Collection` | NoSQL has no SQL; operations are per-collection |
| `ResultSet` | `Cursor` | Iterable result handle |
| `Driver.connect()` | `Driver.connect()` | Identical interface |
| `Driver.acceptsURL()` | `Driver.acceptsURL()` | Identical interface |

The core design is the same: a URL-driven registry dispatches to the first driver that accepts the URL. Drivers self-register on import. The client provides a session abstraction over the underlying connection.

## Key Differences

### Collections, Not SQL

JDBC works with a `Connection` that executes arbitrary SQL. JSNOSLQC works with named `Collection` objects that expose six fixed operations:

```javascript
// JDBC — arbitrary SQL through Statement
const stmt = conn.createStatement();
stmt.executeUpdate('INSERT INTO users VALUES (1, "Alice")');
const rs = stmt.executeQuery('SELECT * FROM users WHERE age > 18');

// JSNOSLQC — named operations on a Collection
const users = client.getCollection('users');
await users.store('u1', { name: 'Alice', age: 30 });
const cursor = await users.find(Filter.where('age').gt(18).build());
```

### Filter Builder, Not String SQL

JDBC accepts raw SQL strings (or parameterised PreparedStatements). JSNOSLQC uses a chainable filter builder that produces a backend-neutral AST:

```javascript
// JDBC
const ps = conn.prepareStatement('SELECT * FROM users WHERE age > ? AND role = ?');
ps.setInt(1, 18);
ps.setString(2, 'admin');

// JSNOSLQC
const filter = Filter.where('age').gt(18).and('role').eq('admin').build();
const cursor = await users.find(filter);
```

The filter AST is translated to native query syntax by each driver — MongoDB `$gt`, DynamoDB `FilterExpression`, Cosmos DB SQL, etc.

### Async-Only

JDBC is synchronous (blocking). JSNOSLQC is async throughout — every operation returns a `Promise`. Use `async`/`await`:

```javascript
// JDBC (synchronous)
ResultSet rs = stmt.executeQuery(sql);
while (rs.next()) { ... }

// JSNOSLQC (async)
const cursor = await col.find(filter);
while (await cursor.next()) {
  const doc = cursor.getDocument();
}

// Or with async iterator
for await (const doc of cursor) { ... }
```

### No PreparedStatement

JDBC distinguishes `Statement` (ad-hoc SQL) from `PreparedStatement` (parameterised SQL). JSNOSLQC has no concept of prepared statements — filters are always constructed via the builder, and parameterisation is handled by the driver translator automatically.

### No Transactions in M1/M2

JDBC's `Connection.setAutoCommit(false)` / `commit()` / `rollback()` have no equivalent in the current JSNOSLQC API. Multi-document transactions are a candidate for a future milestone.

### close() is async

JDBC's `close()` is synchronous. JSNOSLQC's `client.close()` and `cursor.close()` are `async` and return `Promise<void>`.

## Driver Registration

Both JDBC and JSNOSLQC use the same import-triggers-registration pattern:

```java
// JDBC
Class.forName("org.postgresql.Driver"); // triggers static initialiser → registration
```

```javascript
// JSNOSLQC
import '@alt-javascript/jsnoslqc-mongodb'; // side-effect import → DriverManager.registerDriver()
```

## URL Scheme

JDBC URLs use `jdbc:<subprotocol>:<details>`. JSNOSLQC URLs mirror this:

```
jdbc:postgresql://localhost:5432/mydb   →   jsnoslqc:mongodb://localhost:27017/mydb
jdbc:mysql://localhost:3306/mydb        →   jsnoslqc:cassandra:localhost:9042/mykeyspace
```

## ResultSet → Cursor

JDBC's `ResultSet` has typed column accessors (`getString()`, `getInt()`, `getObject()`). JSNOSLQC's `Cursor` returns plain JavaScript objects — no column accessors needed:

```java
// JDBC
while (rs.next()) {
  String name = rs.getString("name");
  int age = rs.getInt("age");
}
```

```javascript
// JSNOSLQC
while (await cursor.next()) {
  const { name, age } = cursor.getDocument();
}
```

## Cheat Sheet

```javascript
import { DriverManager, ClientDataSource, Filter } from '@alt-javascript/jsnoslqc-core';
import '@alt-javascript/jsnoslqc-memory'; // any driver

// DriverManager.getClient — like DriverManager.getConnection in JDBC
const client = await DriverManager.getClient('jsnoslqc:memory:');

// ClientDataSource — like DataSource in JDBC
const ds = new ClientDataSource({ url: 'jsnoslqc:memory:' });
const client2 = await ds.getClient();

// getCollection — like createStatement, but named
const col = client.getCollection('orders');

// CRUD
await col.store('o1', { item: 'Widget', qty: 5 }); // like INSERT / UPSERT
const doc = await col.get('o1');                    // like SELECT WHERE pk = 'o1'
await col.update('o1', { qty: 10 });                // like UPDATE SET qty = 10
await col.delete('o1');                             // like DELETE WHERE pk = 'o1'

// insert — let the backend assign the key (like AUTOINCREMENT / SERIAL)
const id = await col.insert({ item: 'Gadget', qty: 1 });

// find — like PreparedStatement with a filter
const filter = Filter.where('qty').gt(3).build();
const cursor = await col.find(filter);
const docs = cursor.getDocuments(); // like ResultSet → List

// close — always async
await client.close();
```
