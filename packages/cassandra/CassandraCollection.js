/**
 * CassandraCollection — Apache Cassandra Collection implementation.
 *
 * Schema (created automatically):
 *   CREATE TABLE IF NOT EXISTS <collection> (pk text PRIMARY KEY, data text)
 *
 * Documents are stored as JSON in the 'data' column.
 * Primary key = 'pk'.
 *
 * find() strategy:
 *   - pk equality → native CQL WHERE pk = ?
 *   - all other filters → SELECT * FROM table (full scan) + client-side filter
 *
 * ⚠  Full-scan find() is expensive in Cassandra at scale.
 *    ALLOW FILTERING is not used — it's unsafe for large tables.
 *    For production, model your tables to support the access patterns you need.
 */
import { Collection, Cursor } from '@alt-javascript/jsnoslqc-core';
import MemoryFilterEvaluator from '@alt-javascript/jsnoslqc-memory/MemoryFilterEvaluator.js';
import CassandraFilterTranslator from './CassandraFilterTranslator.js';

export default class CassandraCollection extends Collection {
  /**
   * @param {CassandraClient} client
   * @param {string} name — table name
   * @param {import('cassandra-driver').Client} cassandra
   */
  constructor(client, name, cassandra) {
    super(client, name);
    this._cassandra = cassandra;
    this._tableEnsured = false;
  }

  async _ensureTable() {
    if (!this._tableEnsured) {
      await this._cassandra.execute(
        `CREATE TABLE IF NOT EXISTS "${this._name}" (pk text PRIMARY KEY, data text)`
      );
      this._tableEnsured = true;
    }
  }

  async _get(key) {
    await this._ensureTable();
    const result = await this._cassandra.execute(
      `SELECT data FROM "${this._name}" WHERE pk = ?`,
      [key],
      { prepare: true }
    );
    if (result.rowLength === 0) return null;
    return JSON.parse(result.first().data);
  }

  async _store(key, doc) {
    await this._ensureTable();
    await this._cassandra.execute(
      `INSERT INTO "${this._name}" (pk, data) VALUES (?, ?)`,
      [key, JSON.stringify(doc)],
      { prepare: true }
    );
  }

  async _delete(key) {
    await this._ensureTable();
    await this._cassandra.execute(
      `DELETE FROM "${this._name}" WHERE pk = ?`,
      [key],
      { prepare: true }
    );
  }

  async _insert(doc) {
    await this._ensureTable();
    const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
    const stored = { ...doc, _id: id };
    await this._cassandra.execute(
      `INSERT INTO "${this._name}" (pk, data) VALUES (?, ?)`,
      [id, JSON.stringify(stored)],
      { prepare: true }
    );
    return id;
  }

  async _update(key, patch) {
    await this._ensureTable();
    const existing = await this._get(key);
    if (!existing) throw new Error(`Document not found for key: ${key}`);
    const updated = { ...existing, ...patch };
    await this._cassandra.execute(
      `UPDATE "${this._name}" SET data = ? WHERE pk = ?`,
      [JSON.stringify(updated), key],
      { prepare: true }
    );
  }

  async _find(ast) {
    await this._ensureTable();
    const { cql, params, clientSideOnly } = CassandraFilterTranslator.translate(ast);

    let rows;
    if (!clientSideOnly && cql) {
      const result = await this._cassandra.execute(
        `SELECT data FROM "${this._name}" WHERE ${cql}`,
        params,
        { prepare: true }
      );
      rows = result.rows;
    } else {
      // Full scan — Cassandra equivalent of an unindexed filter
      const result = await this._cassandra.execute(
        `SELECT data FROM "${this._name}"`
      );
      rows = result.rows;
    }

    const docs = rows
      .map((r) => JSON.parse(r.data))
      .filter((doc) => MemoryFilterEvaluator.matches(doc, ast));

    return new Cursor(docs);
  }
}
