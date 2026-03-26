/**
 * compliance.spec.js — jsnosqlc-localstorage compliance tests.
 *
 * Runs the shared driver compliance suite twice:
 *   1. LocalStorageDriver (jsnosqlc:localstorage:) with an injected MockStorage
 *   2. SessionStorageDriver (jsnosqlc:sessionstorage:) with an injected MockStorage
 *
 * No browser or jsdom required — MockStorage provides a compatible in-process
 * Web Storage implementation.
 *
 * Also includes a cross-client contamination test to verify that the
 * clientId-based key namespacing prevents data leaking between clients
 * sharing the same physical storage backend.
 */
import { describe, it } from 'mocha';
import { assert } from 'chai';
import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js';
import {
  DriverManager,
  LocalStorageDriver,
  SessionStorageDriver,
  MockStorage,
} from '../index.js';

// Ensure a clean driver registry for this test run.
// localstorage index.js auto-registers both drivers on import.
// We clear and re-register so tests are isolated from other packages.
DriverManager.clear();
DriverManager.registerDriver(new LocalStorageDriver());
DriverManager.registerDriver(new SessionStorageDriver());

// ─────────────────────────────────────────────────────────────────────────────
// localStorage driver compliance
// ─────────────────────────────────────────────────────────────────────────────
describe('localStorage driver compliance', () => {
  runCompliance(async () => {
    const storage = new MockStorage();
    return DriverManager.getClient('jsnosqlc:localstorage:', { storageBackend: storage });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sessionStorage driver compliance
// ─────────────────────────────────────────────────────────────────────────────
describe('sessionStorage driver compliance', () => {
  runCompliance(async () => {
    const storage = new MockStorage();
    return DriverManager.getClient('jsnosqlc:sessionstorage:', { storageBackend: storage });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-client contamination tests
// ─────────────────────────────────────────────────────────────────────────────
describe('cross-client isolation', () => {
  it('two clients sharing the same storage backend do not see each other\'s data', async () => {
    const sharedStorage = new MockStorage();

    const clientA = await DriverManager.getClient('jsnosqlc:localstorage:', { storageBackend: sharedStorage });
    const clientB = await DriverManager.getClient('jsnosqlc:localstorage:', { storageBackend: sharedStorage });

    const colA = clientA.getCollection('items');
    const colB = clientB.getCollection('items');

    await colA.store('key1', { owner: 'A', value: 1 });
    await colB.store('key1', { owner: 'B', value: 2 });

    const docA = await colA.get('key1');
    const docB = await colB.get('key1');

    // Each client sees only its own document
    assert.equal(docA.owner, 'A', 'clientA should see its own document');
    assert.equal(docB.owner, 'B', 'clientB should see its own document');
    assert.notDeepEqual(docA, docB, 'documents should be distinct');

    await clientA.close();
    await clientB.close();
  });

  it('two collections in the same client with overlapping keys do not contaminate', async () => {
    const storage = new MockStorage();
    const client = await DriverManager.getClient('jsnosqlc:localstorage:', { storageBackend: storage });

    const colUsers = client.getCollection('users');
    const colPosts = client.getCollection('posts');

    await colUsers.store('id1', { type: 'user', name: 'Alice' });
    await colPosts.store('id1', { type: 'post', title: 'Hello' });

    const user = await colUsers.get('id1');
    const post = await colPosts.get('id1');

    assert.equal(user.type, 'user');
    assert.equal(post.type, 'post');

    await client.close();
  });

  it('find() in one collection does not return documents from another collection', async () => {
    const storage = new MockStorage();
    const client = await DriverManager.getClient('jsnosqlc:localstorage:', { storageBackend: storage });

    const { Filter } = await import('@alt-javascript/jsnosqlc-core');

    const colA = client.getCollection('collectionA');
    const colB = client.getCollection('collectionB');

    await colA.store('a1', { tag: 'alpha' });
    await colA.store('a2', { tag: 'alpha' });
    await colB.store('b1', { tag: 'alpha' });

    const cursor = await colA.find(Filter.where('tag').eq('alpha').build());
    const docs = cursor.getDocuments();

    // colA has 2 alpha docs; colB's alpha doc must NOT appear
    assert.equal(docs.length, 2, 'find() must be scoped to the collection');

    await client.close();
  });
});
