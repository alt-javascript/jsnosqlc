/**
 * CosmosClient — Azure Cosmos DB Client implementation.
 *
 * Creates containers on demand (like DynamoDB's table creation).
 * Partition key is '/id' — simple, matches our key strategy.
 */
import { Client } from '@alt-javascript/jsnoslqc-core';
import CosmosCollection from './CosmosCollection.js';

export default class CosmosClient extends Client {
  /**
   * @param {string} url — jsnoslqc URL
   * @param {import('@azure/cosmos').CosmosClient} nativeClient
   * @param {import('@azure/cosmos').Database} database
   */
  constructor(url, nativeClient, database) {
    super({ url });
    this._nativeClient = nativeClient;
    this._database = database;
    this._ensuredContainers = new Set();
  }

  _getCollection(name) {
    return new LazyCosmosCollection(this, name);
  }

  /**
   * Ensure a Cosmos DB container exists with /id partition key.
   * @param {string} name
   */
  async ensureContainer(name) {
    if (this._ensuredContainers.has(name)) {
      return this._database.container(name);
    }
    const { container } = await this._database.containers.createIfNotExists({
      id: name,
      partitionKey: { paths: ['/id'], kind: 'Hash' },
    });
    this._ensuredContainers.add(name);
    return container;
  }

  async _close() {
    // @azure/cosmos CosmosClient has no explicit close in v4
  }
}

/**
 * LazyCosmosCollection — ensures the container exists before the first operation.
 */
class LazyCosmosCollection extends CosmosCollection {
  constructor(client, name) {
    // container starts as null — resolved lazily
    super(client, name, null);
    this._containerResolved = false;
  }

  async _ensureContainer() {
    if (!this._containerResolved) {
      this._container = await this._client.ensureContainer(this._name);
      this._containerResolved = true;
    }
  }

  async _get(key) { await this._ensureContainer(); return super._get(key); }
  async _store(key, doc) { await this._ensureContainer(); return super._store(key, doc); }
  async _delete(key) { await this._ensureContainer(); return super._delete(key); }
  async _insert(doc) { await this._ensureContainer(); return super._insert(doc); }
  async _update(key, patch) { await this._ensureContainer(); return super._update(key, patch); }
  async _find(ast) { await this._ensureContainer(); return super._find(ast); }
}
