/**
 * Client — A session to a NoSQL database.
 *
 * Abstract base class. Drivers override `_getCollection()` and `_close()`.
 * Manages a cache of Collection instances keyed by name.
 */
import DriverManager from './DriverManager.js';

export default class Client {
  /**
   * @param {Object} [config]
   * @param {string} [config.url] — jsnoslqc URL (stored for reference)
   */
  constructor(config = {}) {
    this._url = config.url ?? null;
    this._closed = false;
    this._collections = new Map();
  }

  /**
   * Get a Collection by name. Returns a cached instance if already opened.
   * @param {string} name — collection name
   * @returns {Collection}
   */
  getCollection(name) {
    this._checkClosed();
    if (!this._collections.has(name)) {
      this._collections.set(name, this._getCollection(name));
    }
    return this._collections.get(name);
  }

  /**
   * Close the client and release all resources.
   * @returns {Promise<void>}
   */
  async close() {
    this._closed = true;
    this._collections.clear();
    await this._close();
  }

  /** @returns {boolean} */
  isClosed() {
    return this._closed;
  }

  /** @returns {string|null} */
  getUrl() {
    return this._url;
  }

  _checkClosed() {
    if (this._closed) throw new Error('Client is closed');
  }

  // Override in driver implementations
  _getCollection(name) { throw new Error('Not implemented'); }
  async _close() {}
}

/**
 * ClientDataSource — Convenience factory wrapping DriverManager.getClient().
 *
 * Mirrors jsdbc's DataSource pattern.
 */
export class ClientDataSource {
  /**
   * @param {Object} config
   * @param {string} config.url — jsnoslqc URL
   * @param {string} [config.username]
   * @param {string} [config.password]
   * @param {Object} [config.properties] — additional driver properties
   */
  constructor(config = {}) {
    this._url = config.url;
    this._properties = {
      username: config.username,
      password: config.password,
      ...config.properties,
    };
  }

  /**
   * Get a client from the configured data source.
   * @returns {Promise<Client>}
   */
  async getClient() {
    return DriverManager.getClient(this._url, this._properties);
  }

  /** @returns {string} */
  getUrl() {
    return this._url;
  }
}
