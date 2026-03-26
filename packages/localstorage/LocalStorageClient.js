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
import { Client } from '@alt-javascript/jsnosqlc-core';
import LocalStorageCollection from './LocalStorageCollection.js';

let _clientCounter = 0;
function generateClientId() {
  return `jsnc_${Date.now().toString(16)}_${(++_clientCounter).toString(16)}`;
}

export default class LocalStorageClient extends Client {
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
