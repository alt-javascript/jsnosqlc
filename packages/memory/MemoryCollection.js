/**
 * MemoryCollection — In-memory Collection implementation.
 *
 * Backed by a Map<string, Object>. All operations are synchronous internally
 * but wrapped in async for interface compatibility.
 *
 * insert() generates a random hex id. update() shallow-merges the patch.
 * find() applies the Filter AST via MemoryFilterEvaluator.
 */
import { Collection, Cursor } from '@alt-javascript/jsnosqlc-core';
import MemoryFilterEvaluator from './MemoryFilterEvaluator.js';

let _idCounter = 0;
function generateId() {
  // Combine timestamp + counter + random for uniqueness within a session
  return `mem_${Date.now().toString(16)}_${(++_idCounter).toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
}

export default class MemoryCollection extends Collection {
  constructor(client, name, map) {
    super(client, name);
    // _map is the backing Map<string, Object> shared with the client
    this._map = map;
  }

  async _get(key) {
    const doc = this._map.get(key);
    return doc !== undefined ? { ...doc } : null;
  }

  async _store(key, doc) {
    this._map.set(key, { ...doc });
  }

  async _delete(key) {
    this._map.delete(key);
  }

  async _insert(doc) {
    const id = generateId();
    this._map.set(id, { ...doc, _id: id });
    return id;
  }

  async _update(key, patch) {
    const existing = this._map.get(key);
    if (existing === undefined) {
      throw new Error(`Document not found for key: ${key}`);
    }
    this._map.set(key, { ...existing, ...patch });
  }

  async _find(ast) {
    const results = [];
    for (const doc of this._map.values()) {
      if (MemoryFilterEvaluator.matches(doc, ast)) {
        results.push({ ...doc });
      }
    }
    return new Cursor(results);
  }
}
