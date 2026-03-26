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
import { Driver, DriverManager } from '@alt-javascript/jsnosqlc-core';
import LocalStorageClient from './LocalStorageClient.js';

export class LocalStorageDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:localstorage:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(LocalStorageDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    return new LocalStorageClient(url, properties.storageBackend ?? globalThis.localStorage);
  }
}

export class SessionStorageDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:sessionstorage:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(SessionStorageDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    return new LocalStorageClient(url, properties.storageBackend ?? globalThis.sessionStorage);
  }
}

// Auto-register both drivers on import
export const _localDriver = new LocalStorageDriver();
export const _sessionDriver = new SessionStorageDriver();
DriverManager.registerDriver(_localDriver);
DriverManager.registerDriver(_sessionDriver);
