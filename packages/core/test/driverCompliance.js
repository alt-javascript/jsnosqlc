/**
 * driverCompliance.js — Shared compliance test suite for jsnoslqc drivers.
 *
 * Usage in a driver package:
 *
 *   import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js';
 *   import MemoryDriver from '../MemoryDriver.js';
 *   import DriverManager from '@alt-javascript/jsnosqlc-core/DriverManager.js';
 *
 *   runCompliance(async () => {
 *     DriverManager.clear();
 *     DriverManager.registerDriver(new MemoryDriver());
 *     return DriverManager.getClient('jsnosqlc:memory:');
 *   });
 *
 * The clientFactory is called once per describe block to produce a fresh client.
 * The suite calls client.close() in after().
 *
 * Options:
 *   skipFind {boolean} — skip find() tests (for backends without scan support)
 */

import { describe, it, before, after } from 'mocha';
import { assert } from 'chai';
import Filter from '../Filter.js';
import { UnsupportedOperationError } from '../errors.js';

export function runCompliance(clientFactory, options = {}) {
  const { skipFind = false } = options;

  describe('jsnoslqc driver compliance', () => {
    let client;
    let col;

    before(async () => {
      client = await clientFactory();
      col = client.getCollection('compliance_test');
    });

    after(async () => {
      if (client && !client.isClosed()) {
        await client.close();
      }
    });

    // -------------------------------------------------------------------------
    // Key-value operations
    // -------------------------------------------------------------------------
    describe('store and get', () => {
      it('stores a document and retrieves it by key', async () => {
        await col.store('kv-1', { name: 'Alice', age: 30 });
        const doc = await col.get('kv-1');
        assert.isNotNull(doc);
        assert.equal(doc.name, 'Alice');
        assert.equal(doc.age, 30);
      });

      it('get returns null for a missing key', async () => {
        const doc = await col.get('kv-nonexistent-' + Date.now());
        assert.isNull(doc);
      });

      it('store overwrites an existing document (upsert)', async () => {
        await col.store('kv-upsert', { name: 'Bob', age: 25 });
        await col.store('kv-upsert', { name: 'Bob', age: 26 });
        const doc = await col.get('kv-upsert');
        assert.equal(doc.age, 26);
      });
    });

    describe('delete', () => {
      it('deletes a document by key', async () => {
        await col.store('kv-del', { name: 'ToDelete' });
        await col.delete('kv-del');
        const doc = await col.get('kv-del');
        assert.isNull(doc);
      });

      it('delete on a missing key does not throw', async () => {
        await col.delete('kv-missing-' + Date.now());
      });
    });

    // -------------------------------------------------------------------------
    // Document operations
    // -------------------------------------------------------------------------
    describe('insert', () => {
      it('inserts a document and returns an assigned id', async () => {
        const id = await col.insert({ name: 'Charlie', status: 'active' });
        assert.isString(id);
        assert.isNotEmpty(id);
      });

      it('inserted document is retrievable by the returned id', async () => {
        const id = await col.insert({ name: 'Dana', score: 99 });
        const doc = await col.get(id);
        assert.isNotNull(doc);
        assert.equal(doc.name, 'Dana');
      });

      it('two inserts produce different ids', async () => {
        const id1 = await col.insert({ name: 'E1' });
        const id2 = await col.insert({ name: 'E2' });
        assert.notEqual(id1, id2);
      });
    });

    describe('update', () => {
      it('patches specific fields without destroying others', async () => {
        await col.store('upd-1', { name: 'Frank', age: 40, country: 'AU' });
        await col.update('upd-1', { age: 41 });
        const doc = await col.get('upd-1');
        assert.equal(doc.age, 41);
        assert.equal(doc.name, 'Frank');
        assert.equal(doc.country, 'AU');
      });
    });

    // -------------------------------------------------------------------------
    // find() with filter
    // -------------------------------------------------------------------------
    if (!skipFind) {
      describe('find with filter', () => {
        // Seed data for find tests using a dedicated sub-collection
        let fcol;

        before(async () => {
          fcol = client.getCollection('compliance_find');
          await fcol.store('f1', { name: 'Alice', age: 30, status: 'active', tags: ['js', 'ts'], score: 85 });
          await fcol.store('f2', { name: 'Bob', age: 25, status: 'inactive', tags: ['py'], score: 70 });
          await fcol.store('f3', { name: 'Charlie', age: 35, status: 'active', tags: ['js', 'go'], score: 90 });
          await fcol.store('f4', { name: 'Dana', age: 22, status: 'pending', tags: ['ts'], score: 60 });
          await fcol.store('f5', { name: 'Eve', age: 30, status: 'active', score: 95, email: 'eve@example.com' });
        });

        it('eq — finds documents matching exact value', async () => {
          const cursor = await fcol.find(Filter.where('status').eq('active').build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.equal(docs.length, 3);
          assert.isTrue(docs.every((d) => d.status === 'active'));
        });

        it('ne — finds documents not matching value', async () => {
          const cursor = await fcol.find(Filter.where('status').ne('active').build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.equal(docs.length, 2);
          assert.isTrue(docs.every((d) => d.status !== 'active'));
        });

        it('gt — finds documents with field > value', async () => {
          const cursor = await fcol.find(Filter.where('age').gt(29).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.length >= 2);
          assert.isTrue(docs.every((d) => d.age > 29));
        });

        it('lt — finds documents with field < value', async () => {
          const cursor = await fcol.find(Filter.where('age').lt(25).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.every((d) => d.age < 25));
        });

        it('gte — finds documents with field >= value', async () => {
          const cursor = await fcol.find(Filter.where('score').gte(90).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.every((d) => d.score >= 90));
          assert.isTrue(docs.length >= 2);
        });

        it('lte — finds documents with field <= value', async () => {
          const cursor = await fcol.find(Filter.where('score').lte(70).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.every((d) => d.score <= 70));
        });

        it('contains — finds documents where array field contains value', async () => {
          const cursor = await fcol.find(Filter.where('tags').contains('js').build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.length >= 2);
          assert.isTrue(docs.every((d) => d.tags && d.tags.includes('js')));
        });

        it('in — finds documents where field is one of the values', async () => {
          const cursor = await fcol.find(Filter.where('status').in(['active', 'pending']).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.every((d) => ['active', 'pending'].includes(d.status)));
          assert.isTrue(docs.length >= 3);
        });

        it('nin — finds documents where field is not one of the values', async () => {
          const cursor = await fcol.find(Filter.where('status').nin(['inactive', 'pending']).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.every((d) => !['inactive', 'pending'].includes(d.status)));
        });

        it('exists (true) — finds documents where field is present', async () => {
          const cursor = await fcol.find(Filter.where('email').exists(true).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.length >= 1);
          assert.isTrue(docs.every((d) => d.email !== undefined && d.email !== null));
        });

        it('exists (false) — finds documents where field is absent', async () => {
          const cursor = await fcol.find(Filter.where('email').exists(false).build());
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.every((d) => d.email === undefined || d.email === null));
        });

        it('compound and — two conditions both applied', async () => {
          const filter = Filter.where('status').eq('active').and('age').gt(29).build();
          const cursor = await fcol.find(filter);
          const docs = cursor.getDocuments();
          await cursor.close();
          assert.isTrue(docs.every((d) => d.status === 'active' && d.age > 29));
          assert.isTrue(docs.length >= 1);
        });

        it('cursor can be iterated with for-await-of', async () => {
          const cursor = await fcol.find(Filter.where('status').eq('active').build());
          const docs = [];
          for await (const doc of cursor) {
            docs.push(doc);
          }
          assert.isTrue(docs.length >= 3);
        });
      });
    }

    // -------------------------------------------------------------------------
    // Client lifecycle
    // -------------------------------------------------------------------------
    describe('client lifecycle', () => {
      it('getCollection returns the same instance for the same name', () => {
        const c1 = client.getCollection('same-name');
        const c2 = client.getCollection('same-name');
        assert.strictEqual(c1, c2);
      });

      it('isClosed returns false for an open client', () => {
        assert.isFalse(client.isClosed());
      });
    });
  });
}
