/**
 * MemoryClient — In-memory Client implementation.
 *
 * Each collection gets its own isolated Map. Collections are cached by name
 * on the parent Client (via Client.getCollection() caching).
 */
import { Client } from '@alt-javascript/jsnoslqc-core';
import MemoryCollection from './MemoryCollection.js';

export default class MemoryClient extends Client {
  constructor(url) {
    super({ url });
    this._stores = new Map(); // name → Map<string, Object>
  }

  _getCollection(name) {
    if (!this._stores.has(name)) {
      this._stores.set(name, new Map());
    }
    return new MemoryCollection(this, name, this._stores.get(name));
  }

  async _close() {
    this._stores.clear();
  }
}
