/**
 * MongoCollection — MongoDB Collection implementation.
 *
 * Wraps a mongodb.Collection. Uses _id as the primary key for
 * get/store/delete operations. insert() lets MongoDB generate the ObjectId
 * but we return it as a string.
 */
import { Collection, Cursor } from '@alt-javascript/jsnoslqc-core';
import MongoFilterTranslator from './MongoFilterTranslator.js';

export default class MongoCollection extends Collection {
  /**
   * @param {MongoClient} client
   * @param {string} name — collection name
   * @param {import('mongodb').Collection} mongoCollection
   */
  constructor(client, name, mongoCollection) {
    super(client, name);
    this._col = mongoCollection;
  }

  async _get(key) {
    const doc = await this._col.findOne({ _id: key });
    return doc ?? null;
  }

  async _store(key, doc) {
    await this._col.replaceOne({ _id: key }, { ...doc, _id: key }, { upsert: true });
  }

  async _delete(key) {
    await this._col.deleteOne({ _id: key });
  }

  async _insert(doc) {
    // Generate a string id upfront so get(id) works with the same string.
    // Using a hex timestamp + random avoids importing uuid and keeps it simple.
    const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
    await this._col.insertOne({ ...doc, _id: id });
    return id;
  }

  async _update(key, patch) {
    await this._col.updateOne({ _id: key }, { $set: patch });
  }

  async _find(ast) {
    const query = MongoFilterTranslator.translate(ast);
    const docs = await this._col.find(query).toArray();
    return new Cursor(docs);
  }
}
