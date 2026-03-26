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
export default class MockStorage {
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
