/**
 * RedisCollection — Redis Collection implementation.
 *
 * Redis is a key-value store. Documents are stored as JSON strings under
 * namespaced keys: `jsnosqlc:<collectionName>:<key>`.
 *
 * A secondary index (a Redis Set) tracks all keys in a collection:
 *   `jsnosqlc:<collectionName>:_keys` — Set of all document keys
 *
 * This enables find() without a full SCAN of the entire keyspace.
 *
 * ⚠  find() fetches ALL documents in the collection, then filters in-memory.
 *    This is NOT production-scalable. Use Redis Search (RediSearch) for
 *    production filter queries. Document this limitation clearly.
 *
 * insert() generates a string id.
 * update() is a read-merge-write (not atomic — no transactions in M2).
 */
import { Collection, Cursor } from '@alt-javascript/jsnosqlc-core';
import MemoryFilterEvaluator from '@alt-javascript/jsnosqlc-memory/MemoryFilterEvaluator.js';

export default class RedisCollection extends Collection {
  /**
   * @param {RedisClient} client
   * @param {string} name — collection name
   * @param {import('ioredis').Redis} redis
   */
  constructor(client, name, redis) {
    super(client, name);
    this._redis = redis;
    this._prefix = `jsnosqlc:${name}:`;
    this._indexKey = `jsnosqlc:${name}:_keys`;
  }

  _docKey(key) {
    return `${this._prefix}${key}`;
  }

  async _get(key) {
    const raw = await this._redis.get(this._docKey(key));
    if (raw === null) return null;
    return JSON.parse(raw);
  }

  async _store(key, doc) {
    await this._redis.set(this._docKey(key), JSON.stringify(doc));
    await this._redis.sadd(this._indexKey, key);
  }

  async _delete(key) {
    await this._redis.del(this._docKey(key));
    await this._redis.srem(this._indexKey, key);
  }

  async _insert(doc) {
    const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
    const stored = { ...doc, _id: id };
    await this._redis.set(this._docKey(id), JSON.stringify(stored));
    await this._redis.sadd(this._indexKey, id);
    return id;
  }

  async _update(key, patch) {
    const existing = await this._get(key);
    if (!existing) throw new Error(`Document not found for key: ${key}`);
    const updated = { ...existing, ...patch };
    await this._redis.set(this._docKey(key), JSON.stringify(updated));
  }

  /**
   * find() — FULL COLLECTION SCAN + in-memory filter.
   * ⚠ Not production-scalable. All documents are fetched before filtering.
   */
  async _find(ast) {
    const keys = await this._redis.smembers(this._indexKey);
    if (keys.length === 0) return new Cursor([]);

    const pipeline = this._redis.pipeline();
    for (const key of keys) {
      pipeline.get(this._docKey(key));
    }
    const results = await pipeline.exec();

    const docs = [];
    for (const [err, raw] of results) {
      if (err || raw === null) continue;
      const doc = JSON.parse(raw);
      if (MemoryFilterEvaluator.matches(doc, ast)) {
        docs.push(doc);
      }
    }
    return new Cursor(docs);
  }
}
