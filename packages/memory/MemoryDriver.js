/**
 * MemoryDriver — In-memory jsnoslqc driver.
 *
 * Handles URL: jsnoslqc:memory:
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnoslqc-core';
import MemoryClient from './MemoryClient.js';

export default class MemoryDriver extends Driver {
  static URL_PREFIX = 'jsnoslqc:memory:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(MemoryDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    return new MemoryClient(url);
  }
}

// Auto-register on import
const _driver = new MemoryDriver();
DriverManager.registerDriver(_driver);

export { MemoryClient, _driver };
