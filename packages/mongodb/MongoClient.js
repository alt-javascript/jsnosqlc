/**
 * MongoClient — MongoDB Client implementation.
 *
 * Wraps a mongodb.MongoClient. Collections are created from the configured
 * database. Each call to _getCollection() returns a MongoCollection wrapping
 * the native mongodb.Collection.
 */
import { Client } from '@alt-javascript/jsnosqlc-core';
import MongoCollection from './MongoCollection.js';
import { MongoClient as NativeMongoClient } from 'mongodb';

export default class MongoClient extends Client {
  /**
   * @param {string} url — full jsnosqlc URL (e.g. jsnosqlc:mongodb://localhost:27017/mydb)
   * @param {NativeMongoClient} nativeClient — connected mongodb.MongoClient
   * @param {import('mongodb').Db} db — the resolved database
   */
  constructor(url, nativeClient, db) {
    super({ url });
    this._nativeClient = nativeClient;
    this._db = db;
  }

  _getCollection(name) {
    return new MongoCollection(this, name, this._db.collection(name));
  }

  async _close() {
    await this._nativeClient.close();
  }
}
