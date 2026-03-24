/**
 * CosmosCollection — Azure Cosmos DB Collection implementation.
 *
 * Maps jsnoslqc operations to Cosmos DB SDK calls.
 * Uses the item 'id' field as the primary key (Cosmos DB's required field).
 *
 * Key strategy:
 *   - store(key, doc): upsert item with id = key
 *   - get(key): point-read item by id = key
 *   - delete(key): delete item by id = key
 *   - insert(doc): generate id, upsert
 *   - update(key, patch): read → merge → upsert
 *   - find(ast): SQL query via CosmosFilterTranslator
 */
import { Collection, Cursor } from '@alt-javascript/jsnosqlc-core';
import CosmosFilterTranslator from './CosmosFilterTranslator.js';

export default class CosmosCollection extends Collection {
  /**
   * @param {CosmosClient} client
   * @param {string} name — container name
   * @param {import('@azure/cosmos').Container} container
   */
  constructor(client, name, container) {
    super(client, name);
    this._container = container;
  }

  async _get(key) {
    try {
      const { resource } = await this._container.item(key, key).read();
      return resource ?? null;
    } catch (err) {
      if (err.code === 404) return null;
      throw err;
    }
  }

  async _store(key, doc) {
    await this._container.items.upsert({ ...doc, id: key });
  }

  async _delete(key) {
    try {
      await this._container.item(key, key).delete();
    } catch (err) {
      if (err.code === 404) return; // silent — same as other drivers
      throw err;
    }
  }

  async _insert(doc) {
    const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
    await this._container.items.upsert({ ...doc, id });
    return id;
  }

  async _update(key, patch) {
    const existing = await this._get(key);
    if (!existing) throw new Error(`Document not found for key: ${key}`);
    await this._container.items.upsert({ ...existing, ...patch, id: key });
  }

  async _find(ast) {
    const { whereClause, parameters } = CosmosFilterTranslator.translate(ast);
    const sql = whereClause
      ? `SELECT * FROM c WHERE ${whereClause}`
      : 'SELECT * FROM c';

    const { resources } = await this._container.items.query({ query: sql, parameters }).fetchAll();
    return new Cursor(resources ?? []);
  }
}
