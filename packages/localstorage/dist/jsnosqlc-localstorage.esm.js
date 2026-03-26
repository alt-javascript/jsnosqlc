/**
 * Driver — Creates client connections to a specific NoSQL database type.
 *
 * Each driver implementation registers itself with DriverManager on import
 * and declares which URL schemes it handles.
 *
 * URL scheme: jsnosqlc:<subprotocol>:<connection-details>
 * e.g. jsnosqlc:mongodb://localhost:27017/mydb
 *      jsnosqlc:memory:
 *      jsnosqlc:dynamodb:us-east-1
 */
class Driver {
  /**
   * Check if this driver handles the given jsnosqlc URL.
   * @param {string} url — e.g. 'jsnosqlc:mongodb://localhost:27017/mydb'
   * @returns {boolean}
   */
  acceptsURL(url) {
    return false;
  }

  /**
   * Create a client connection to the database.
   * @param {string} url — jsnosqlc URL
   * @param {Object} [properties] — { username, password, ...driverSpecific }
   * @returns {Promise<Client>}
   */
  async connect(url, properties = {}) {
    throw new Error('Not implemented');
  }
}

/**
 * DriverManager — Registry for jsnosqlc drivers.
 *
 * Drivers register themselves on import. When getClient() is called,
 * DriverManager iterates registered drivers to find one that accepts the URL.
 */
class DriverManager {
  static _drivers = [];

  /**
   * Register a driver instance.
   * @param {Driver} driver
   */
  static registerDriver(driver) {
    if (!DriverManager._drivers.includes(driver)) {
      DriverManager._drivers.push(driver);
    }
  }

  /**
   * Remove a driver.
   * @param {Driver} driver
   */
  static deregisterDriver(driver) {
    DriverManager._drivers = DriverManager._drivers.filter((d) => d !== driver);
  }

  /**
   * Get a client from the first driver that accepts the URL.
   * @param {string} url — jsnosqlc URL
   * @param {Object} [properties] — connection properties
   * @returns {Promise<Client>}
   */
  static async getClient(url, properties = {}) {
    for (const driver of DriverManager._drivers) {
      if (driver.acceptsURL(url)) {
        return driver.connect(url, properties);
      }
    }
    throw new Error(`No suitable driver found for URL: ${url}`);
  }

  /**
   * Get all registered drivers.
   * @returns {Driver[]}
   */
  static getDrivers() {
    return [...DriverManager._drivers];
  }

  /** Clear all registered drivers (for testing). */
  static clear() {
    DriverManager._drivers = [];
  }
}

/**
 * Client — A session to a NoSQL database.
 *
 * Abstract base class. Drivers override `_getCollection()` and `_close()`.
 * Manages a cache of Collection instances keyed by name.
 */

class Client {
  /**
   * @param {Object} [config]
   * @param {string} [config.url] — jsnosqlc URL (stored for reference)
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
class ClientDataSource {
  /**
   * @param {Object} config
   * @param {string} config.url — jsnosqlc URL
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

/**
 * errors.js — Custom error classes for jsnosqlc.
 */

/**
 * Thrown when a driver does not implement an optional Collection operation.
 * Callers can `instanceof`-check this to handle gracefully.
 */
class UnsupportedOperationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedOperationError';
  }
}

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

class Collection {
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

/**
 * Cursor — Represents the result of a find() operation.
 *
 * Provides cursor-based iteration (next/getDocument) plus bulk access
 * (getDocuments) and implements the async iterator protocol for use with
 * `for await...of`.
 *
 * Base class holds a row array. Driver implementations may override to
 * support streaming from the database instead of buffering all results.
 */
class Cursor {
  /**
   * @param {Object[]} [documents] — buffered result array (optional for streaming subclasses)
   */
  constructor(documents = []) {
    this._documents = documents;
    this._cursor = -1;
    this._closed = false;
  }

  /**
   * Advance cursor to the next document.
   * @returns {Promise<boolean>} true if there is a current document
   */
  async next() {
    this._checkClosed();
    this._cursor++;
    return this._cursor < this._documents.length;
  }

  /**
   * Get the document at the current cursor position.
   * @returns {Object}
   */
  getDocument() {
    this._checkClosed();
    this._checkCursor();
    return { ...this._documents[this._cursor] };
  }

  /**
   * Get all documents as an array without cursor iteration.
   * @returns {Object[]}
   */
  getDocuments() {
    this._checkClosed();
    return this._documents.map((d) => ({ ...d }));
  }

  /** Close the cursor and release resources. */
  async close() {
    this._closed = true;
  }

  /** @returns {boolean} */
  isClosed() {
    return this._closed;
  }

  /** Async iterator protocol — enables `for await (const doc of cursor)` */
  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        const hasMore = await this.next();
        if (hasMore) {
          return { value: this.getDocument(), done: false };
        }
        await this.close();
        return { value: undefined, done: true };
      },
    };
  }

  _checkClosed() {
    if (this._closed) throw new Error('Cursor is closed');
  }

  _checkCursor() {
    if (this._cursor < 0 || this._cursor >= this._documents.length) {
      throw new Error('Cursor is not on a valid document — call next() first');
    }
  }
}

/**
 * FieldCondition — Represents a field-level condition within a Filter.
 *
 * Created by Filter.where(field) or Filter.and(field). Operator methods
 * store the condition into the parent Filter and return the Filter for
 * further chaining.
 *
 * Supported operators: eq, ne, gt, gte, lt, lte, contains, in, nin, exists
 */
class FieldCondition {
  /**
   * @param {string} field — field name
   * @param {import('./Filter.js').default} filter — owning Filter instance
   */
  constructor(field, filter) {
    this._field = field;
    this._filter = filter;
  }

  /** Equal: field === value */
  eq(value) { return this._add('eq', value); }

  /** Not equal: field !== value */
  ne(value) { return this._add('ne', value); }

  /** Greater than: field > value */
  gt(value) { return this._add('gt', value); }

  /** Greater than or equal: field >= value */
  gte(value) { return this._add('gte', value); }

  /** Less than: field < value */
  lt(value) { return this._add('lt', value); }

  /** Less than or equal: field <= value */
  lte(value) { return this._add('lte', value); }

  /**
   * Contains: field contains value (string substring or array element).
   * For arrays: field contains the given element.
   * For strings: field contains the given substring.
   */
  contains(value) { return this._add('contains', value); }

  /** In: field is one of values[] */
  in(values) { return this._add('in', values); }

  /** Not in: field is not one of values[] */
  nin(values) { return this._add('nin', values); }

  /**
   * Exists: field is present (and not null/undefined) when value is true,
   * or absent/null/undefined when value is false.
   * @param {boolean} [value=true]
   */
  exists(value = true) { return this._add('exists', value); }

  _add(op, value) {
    this._filter._addCondition({ type: 'condition', field: this._field, op, value });
    return this._filter;
  }
}

/**
 * Filter — Chainable query filter builder.
 *
 * Usage:
 *   const filter = Filter.where('age').gt(18).and('name').eq('Alice');
 *   const ast = filter.build();
 *
 * Compound operators:
 *   Filter.or(filter1, filter2)  → { type: 'or', conditions: [ast1, ast2] }
 *   Filter.where('age').gt(18).not()  → { type: 'not', condition: ast }
 *
 * AST node shapes:
 *   Leaf:     { type: 'condition', field: string, op: string, value: * }
 *   And:      { type: 'and', conditions: ConditionNode[] }
 *   Or:       { type: 'or',  conditions: ConditionNode[] }
 *   Not:      { type: 'not', condition: ConditionNode }
 */

class Filter {
  constructor() {
    this._conditions = [];
  }

  /**
   * Start a new filter with the given field.
   * @param {string} field
   * @returns {FieldCondition}
   */
  static where(field) {
    const filter = new Filter();
    return new FieldCondition(field, filter);
  }

  /**
   * Create an OR compound of two or more already-built filter ASTs.
   * Each argument should be a built AST node (the result of filter.build())
   * or a Filter instance (build() is called automatically).
   *
   * @param {...(Object|Filter)} filters — AST nodes or Filter instances
   * @returns {Object} { type: 'or', conditions: [...] }
   */
  static or(...filters) {
    const conditions = filters.map((f) =>
      f instanceof Filter ? f.build() : f
    );
    return { type: 'or', conditions };
  }

  /**
   * Chain an additional AND condition on a new field.
   * @param {string} field
   * @returns {FieldCondition}
   */
  and(field) {
    return new FieldCondition(field, this);
  }

  /**
   * Negate this filter.
   * Calls build() internally and wraps the result in a not node.
   * @returns {Object} { type: 'not', condition: ast }
   */
  not() {
    return { type: 'not', condition: this.build() };
  }

  /**
   * Build and return the filter AST.
   *
   * Single condition → returns the leaf node directly.
   * Multiple conditions → wraps in { type: 'and', conditions: [...] }.
   *
   * @returns {Object} AST node
   */
  build() {
    if (this._conditions.length === 0) {
      return { type: 'and', conditions: [] };
    }
    if (this._conditions.length === 1) {
      return { ...this._conditions[0] };
    }
    return { type: 'and', conditions: this._conditions.map((c) => ({ ...c })) };
  }

  /** @internal — called by FieldCondition */
  _addCondition(node) {
    this._conditions.push(node);
  }
}

/**
 * MemoryFilterEvaluator — Applies a Filter AST to an in-memory document.
 *
 * Handles:
 *   Leaf:  { type: 'condition', field, op, value }
 *   And:   { type: 'and', conditions: [...] }
 *   Or:    { type: 'or',  conditions: [...] }
 *   Not:   { type: 'not', condition: ... }
 *
 * Supported operators: eq, ne, gt, gte, lt, lte, contains, in, nin, exists
 */
class MemoryFilterEvaluator {
  /**
   * Test whether a document matches the given filter AST.
   * @param {Object} doc
   * @param {Object} ast — Filter AST node
   * @returns {boolean}
   */
  static matches(doc, ast) {
    if (!ast) return true;

    if (ast.type === 'and') {
      if (!ast.conditions || ast.conditions.length === 0) return true;
      return ast.conditions.every((c) => MemoryFilterEvaluator.matches(doc, c));
    }

    if (ast.type === 'or') {
      if (!ast.conditions || ast.conditions.length === 0) return false;
      return ast.conditions.some((c) => MemoryFilterEvaluator.matches(doc, c));
    }

    if (ast.type === 'not') {
      return !MemoryFilterEvaluator.matches(doc, ast.condition);
    }

    if (ast.type === 'condition') {
      return MemoryFilterEvaluator._evalCondition(doc, ast);
    }

    throw new Error(`Unknown filter AST node type: ${ast.type}`);
  }

  static _evalCondition(doc, { field, op, value }) {
    const fieldValue = MemoryFilterEvaluator._resolve(doc, field);

    switch (op) {
      case 'eq':
        return fieldValue === value;

      case 'ne':
        return fieldValue !== value;

      case 'gt':
        return fieldValue != null && fieldValue > value;

      case 'gte':
        return fieldValue != null && fieldValue >= value;

      case 'lt':
        return fieldValue != null && fieldValue < value;

      case 'lte':
        return fieldValue != null && fieldValue <= value;

      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(value);
        }
        return false;

      case 'in':
        if (!Array.isArray(value)) return false;
        return value.includes(fieldValue);

      case 'nin':
        if (!Array.isArray(value)) return true;
        return !value.includes(fieldValue);

      case 'exists':
        if (value === false) {
          return fieldValue === undefined || fieldValue === null;
        }
        return fieldValue !== undefined && fieldValue !== null;

      default:
        throw new Error(`Unknown filter operator: ${op}`);
    }
  }

  /**
   * Resolve a (potentially dot-notation) field path from a document.
   * e.g. 'address.city' → doc.address.city
   */
  static _resolve(doc, field) {
    if (!field.includes('.')) {
      return doc[field];
    }
    return field.split('.').reduce((obj, key) => (obj != null ? obj[key] : undefined), doc);
  }
}

/**
 * LocalStorageCollection — Collection backed by a Web Storage object.
 *
 * Key namespacing scheme: `<clientId>:<collectionName>:<docKey>`
 *
 * All documents are stored as JSON strings. The clientId is generated at
 * LocalStorageClient construction time, preventing cross-client contamination
 * when multiple jsnosqlc clients share the same storage backend.
 *
 * find() iterates all storage keys with the matching prefix and applies
 * MemoryFilterEvaluator to each parsed document.
 *
 * Supported operations: get, store, delete, insert, update, find
 */

let _idCounter = 0;
function generateId() {
  return `ls_${Date.now().toString(16)}_${(++_idCounter).toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
}

class LocalStorageCollection extends Collection {
  /**
   * @param {import('@alt-javascript/jsnosqlc-core').Client} client
   * @param {string} name — collection name
   * @param {string} clientId — unique id generated by LocalStorageClient
   * @param {Storage} storage — Web Storage object (localStorage, sessionStorage, or MockStorage)
   */
  constructor(client, name, clientId, storage) {
    super(client, name);
    this._clientId = clientId;
    this._storage = storage;
    // Namespace prefix: all keys for this collection look like "<clientId>:<name>:"
    this._prefix = `${clientId}:${name}:`;
  }

  /** Build a namespaced storage key from a document key. */
  _nsKey(key) {
    return `${this._prefix}${key}`;
  }

  async _get(key) {
    const raw = this._storage.getItem(this._nsKey(key));
    if (raw === null) return null;
    return JSON.parse(raw);
  }

  async _store(key, doc) {
    this._storage.setItem(this._nsKey(key), JSON.stringify(doc));
  }

  async _delete(key) {
    this._storage.removeItem(this._nsKey(key));
  }

  async _insert(doc) {
    const id = generateId();
    this._storage.setItem(this._nsKey(id), JSON.stringify({ ...doc, _id: id }));
    return id;
  }

  async _update(key, patch) {
    const existing = await this._get(key);
    if (existing === null) {
      throw new Error(`Document not found for key: ${key}`);
    }
    this._storage.setItem(this._nsKey(key), JSON.stringify({ ...existing, ...patch }));
  }

  async _find(ast) {
    const results = [];
    const prefixLen = this._prefix.length;

    for (let i = 0; i < this._storage.length; i++) {
      const rawKey = this._storage.key(i);
      if (rawKey !== null && rawKey.startsWith(this._prefix)) {
        const raw = this._storage.getItem(rawKey);
        if (raw !== null) {
          const doc = JSON.parse(raw);
          if (MemoryFilterEvaluator.matches(doc, ast)) {
            results.push(doc);
          }
        }
      }
    }

    return new Cursor(results);
  }
}

/**
 * LocalStorageClient — Client backed by a Web Storage object.
 *
 * Generates a unique clientId on construction to namespace all keys,
 * preventing cross-client contamination when multiple clients share the
 * same storage backend.
 *
 * The storageBackend defaults to globalThis.localStorage in browser
 * environments. Tests inject a MockStorage instance.
 */

let _clientCounter = 0;
function generateClientId() {
  return `jsnc_${Date.now().toString(16)}_${(++_clientCounter).toString(16)}`;
}

class LocalStorageClient extends Client {
  /**
   * @param {string} url — jsnosqlc URL
   * @param {Storage} storageBackend — Web Storage object (defaults to globalThis.localStorage)
   */
  constructor(url, storageBackend) {
    super({ url });
    this._clientId = generateClientId();
    // Allow explicit null to fall through to globalThis.localStorage at runtime
    this._storageBackend = storageBackend ?? globalThis.localStorage;
  }

  _getCollection(name) {
    return new LocalStorageCollection(this, name, this._clientId, this._storageBackend);
  }

  async _close() {
    // Web Storage has no connection concept — nothing to release
  }
}

/**
 * LocalStorageDriver — jsnosqlc driver for browser localStorage.
 * SessionStorageDriver — jsnosqlc driver for browser sessionStorage.
 *
 * URL schemes:
 *   jsnosqlc:localstorage:   → localStorage (or injected storageBackend)
 *   jsnosqlc:sessionstorage: → sessionStorage (or injected storageBackend)
 *
 * Isomorphic usage: pass a MockStorage (or any Web Storage-compatible object)
 * via properties.storageBackend for use in Node.js test environments.
 *
 * Auto-registers both drivers with DriverManager on import.
 */

class LocalStorageDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:localstorage:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(LocalStorageDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    return new LocalStorageClient(url, properties.storageBackend ?? globalThis.localStorage);
  }
}

class SessionStorageDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:sessionstorage:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(SessionStorageDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    return new LocalStorageClient(url, properties.storageBackend ?? globalThis.sessionStorage);
  }
}

// Auto-register both drivers on import
const _localDriver = new LocalStorageDriver();
const _sessionDriver = new SessionStorageDriver();
DriverManager.registerDriver(_localDriver);
DriverManager.registerDriver(_sessionDriver);

/**
 * MockStorage — In-memory implementation of the Web Storage API.
 *
 * Implements: getItem, setItem, removeItem, clear, length, key
 *
 * Used in Node.js test environments where globalThis.localStorage does not
 * exist. Injected via the `storageBackend` property option.
 *
 * The backing store is a plain Map — keys are always strings; values are
 * always strings (Web Storage serialises everything to string).
 */
class MockStorage {
  constructor() {
    /** @type {Map<string, string>} */
    this._data = new Map();
  }

  /**
   * @param {string} key
   * @returns {string|null}
   */
  getItem(key) {
    const val = this._data.get(String(key));
    return val !== undefined ? val : null;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    this._data.set(String(key), String(value));
  }

  /**
   * @param {string} key
   */
  removeItem(key) {
    this._data.delete(String(key));
  }

  /** Remove all items. */
  clear() {
    this._data.clear();
  }

  /** @returns {number} */
  get length() {
    return this._data.size;
  }

  /**
   * Return the nth key in insertion order.
   * @param {number} index
   * @returns {string|null}
   */
  key(index) {
    const keys = [...this._data.keys()];
    return index >= 0 && index < keys.length ? keys[index] : null;
  }
}

/**
 * index.js — Public exports for @alt-javascript/jsnosqlc-localstorage
 *
 * Re-exports the full core API alongside localstorage-specific classes so that
 * browser consumers can import everything they need from a single bundle:
 *
 *   import { DriverManager, Filter } from './jsnosqlc-localstorage.esm.js';
 */

export { Client, ClientDataSource, Collection, Cursor, Driver, DriverManager, FieldCondition, Filter, LocalStorageClient, LocalStorageCollection, LocalStorageDriver, MemoryFilterEvaluator, MockStorage, SessionStorageDriver, UnsupportedOperationError, _localDriver, _sessionDriver };
