# Getting Started

This tutorial walks you through your first JSNOSLQC operations — storing documents, querying with filters, and switching drivers. By the end you'll have run code against two different backends by changing a single URL string.

## Prerequisites

- Node.js 18 or later
- npm

## Install

```bash
mkdir jsnosqlc-demo && cd jsnosqlc-demo
npm init -y
npm install @alt-javascript/jsnosqlc-core @alt-javascript/jsnosqlc-memory
```

Add `"type": "module"` to your `package.json`.

## Step 1: Connect and Store a Document

Create `demo.js`:

```javascript
import { DriverManager } from '@alt-javascript/jsnosqlc-core';
import '@alt-javascript/jsnosqlc-memory';

const client = await DriverManager.getClient('jsnosqlc:memory:');
const users = client.getCollection('users');

await users.store('u1', { name: 'Alice', age: 30, role: 'admin' });
const alice = await users.get('u1');
console.log('Stored and retrieved:', alice.name, alice.age);

await client.close();
```

```bash
node demo.js
# Stored and retrieved: Alice 30
```

Importing `@alt-javascript/jsnosqlc-memory` registers the in-memory driver with `DriverManager`. The `store()` call writes the document under the key `u1`. `get()` retrieves it.

## Step 2: Insert and Update

```javascript
// Insert — backend assigns the id
const id = await users.insert({ name: 'Bob', age: 25, role: 'viewer' });
console.log('Inserted id:', id);

// Partial update — only 'role' changes; 'name' and 'age' are preserved
await users.update(id, { role: 'editor' });
const bob = await users.get(id);
console.log('Updated role:', bob.role); // editor
```

## Step 3: Query with a Filter

```javascript
import { Filter } from '@alt-javascript/jsnosqlc-core';

// Find all users aged over 25 with the 'admin' role
const filter = Filter.where('age').gt(25).and('role').eq('admin').build();
const cursor = await users.find(filter);
const admins = cursor.getDocuments();
console.log('Admins over 25:', admins.map(u => u.name)); // ['Alice']
```

## Step 4: Iterate a Cursor

Cursors support both bulk access and async iteration:

```javascript
// Bulk access — get all at once
const all = (await users.find(Filter.where('age').gte(18).build())).getDocuments();

// Async iterator
for await (const user of await users.find(Filter.where('role').ne('admin').build())) {
  console.log(user.name, user.role);
}
```

## Step 5: Switch to MongoDB

Install the MongoDB driver and start a local instance:

```bash
npm install @alt-javascript/jsnosqlc-mongodb
docker run --rm -d -p 27017:27017 mongo:7
```

Change the URL in `demo.js` — no other code changes required:

```javascript
import '@alt-javascript/jsnosqlc-mongodb';

const client = await DriverManager.getClient('jsnosqlc:mongodb://localhost:27017/demo');
```

All `store`, `get`, `insert`, `update`, `find`, and `delete` calls behave identically. The only change is the URL and the import.

## Step 6: Use localStorage in the Browser

The in-memory and localStorage drivers ship as pre-built ESM bundles — no bundler required. Create `demo.html`:

```html
<!DOCTYPE html>
<html>
<head><title>jsnosqlc browser demo</title></head>
<body>
<script type="module">
  import { DriverManager, Filter } from
    'https://unpkg.com/@alt-javascript/jsnosqlc-localstorage/dist/jsnosqlc-localstorage.esm.js';

  const client = await DriverManager.getClient('jsnosqlc:localstorage:');
  const users = client.getCollection('users');

  await users.store('u1', { name: 'Alice', age: 30 });
  const alice = await users.get('u1');
  console.log('Retrieved:', alice.name); // Alice — persists across reloads

  const filter = Filter.where('age').gte(18).build();
  const cursor = await users.find(filter);
  console.log('Found:', cursor.getDocuments().length);

  await client.close();
</script>
</body>
</html>
```

Open `demo.html` in a browser. The documents survive page reload — they live in `localStorage`. Open DevTools → Application → Local Storage to see the raw key/value pairs.

To use `sessionStorage` instead (cleared when the tab closes), change the URL:

```javascript
const client = await DriverManager.getClient('jsnosqlc:sessionstorage:');
```

## What You've Learned

- How to connect to a driver with `DriverManager.getClient(url)`
- How to store, retrieve, update, insert, and delete documents via a `Collection`
- How to build filter queries with `Filter.where(...).and(...).build()`
- How to iterate results with `getDocuments()` and `for await...of`
- How to switch backends by changing a URL string

## Next Steps

- [API Reference](api-reference.md) — full interface documentation
- [Driver Guide](driver-guide.md) — write a driver for any database
- [Choosing a Driver](https://github.com/alt-javascript/jsnosqlc#packages) — compare all nine drivers
