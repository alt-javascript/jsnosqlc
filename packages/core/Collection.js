/**
 * Collection — Represents a named collection (or table/bucket) within a Client.
 *
 * Base class. Driver implementations override the `_` methods.
 * All base methods throw UnsupportedOperationError — drivers implement only
 * what their backend supports.
 *
 * Operations:
 *   Key-value: get(key), store(key, doc), delete(key)
 *   Document:  insert(doc), update(key, patch)
 *   Query:     find(filter)
 */
import { UnsupportedOperationError } from './errors.js';

export default class Collection {
  /**
   * @param {Client} client — owning client
   * @param {string} name — collection name
   */
  constructor(client, name) {
    this._client = client;
    this._name = name;
    this._closed = false;
  }

  /** @returns {string} collection name */
  getName() {
    return this._name;
  }

  /**
   * Retrieve a document by its primary key.
   * @param {string} key
   * @returns {Promise<Object|null>}
   */
  async get(key) {
    this._checkClosed();
    return this._get(key);
  }

  /**
   * Store (upsert) a document under the given key.
   * @param {string} key
   * @param {Object} doc
   * @returns {Promise<void>}
   */
  async store(key, doc) {
    this._checkClosed();
    return this._store(key, doc);
  }

  /**
   * Delete a document by its primary key.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(key) {
    this._checkClosed();
    return this._delete(key);
  }

  /**
   * Insert a document, letting the backend assign the key / _id.
   * @param {Object} doc
   * @returns {Promise<string>} the assigned key / _id
   */
  async insert(doc) {
    this._checkClosed();
    return this._insert(doc);
  }

  /**
   * Update (patch) a document by its primary key.
   * Only provided fields are updated; others are preserved.
   * @param {string} key
   * @param {Object} patch
   * @returns {Promise<void>}
   */
  async update(key, patch) {
    this._checkClosed();
    return this._update(key, patch);
  }

  /**
   * Find documents matching the given filter.
   * @param {Filter} filter — built via Filter.where()...build()
   * @returns {Promise<Cursor>}
   */
  async find(filter) {
    this._checkClosed();
    return this._find(filter);
  }

  _checkClosed() {
    if (this._closed) throw new Error('Collection is closed');
  }

  // Subclasses override these
  async _get(key) { throw new UnsupportedOperationError('get() is not supported by this driver'); }
  async _store(key, doc) { throw new UnsupportedOperationError('store() is not supported by this driver'); }
  async _delete(key) { throw new UnsupportedOperationError('delete() is not supported by this driver'); }
  async _insert(doc) { throw new UnsupportedOperationError('insert() is not supported by this driver'); }
  async _update(key, patch) { throw new UnsupportedOperationError('update() is not supported by this driver'); }
  async _find(filter) { throw new UnsupportedOperationError('find() is not supported by this driver'); }
}
