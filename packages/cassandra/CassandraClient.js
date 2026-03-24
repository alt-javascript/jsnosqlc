/**
 * CassandraClient — Apache Cassandra Client implementation.
 *
 * Manages the keyspace and collection (table) lifecycle.
 * Each collection is a table with schema: (pk text PRIMARY KEY, data text).
 */
import { Client } from '@alt-javascript/jsnosqlc-core';
import CassandraCollection from './CassandraCollection.js';

export default class CassandraClient extends Client {
  /**
   * @param {string} url — jsnoslqc URL
   * @param {import('cassandra-driver').Client} cassandra — connected client
   */
  constructor(url, cassandra) {
    super({ url });
    this._cassandra = cassandra;
  }

  _getCollection(name) {
    return new CassandraCollection(this, name, this._cassandra);
  }

  async _close() {
    await this._cassandra.shutdown();
  }
}
