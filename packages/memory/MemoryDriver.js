/**
 * MemoryDriver — In-memory jsnosqlc driver.
 *
 * Handles URL: jsnosqlc:memory:
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnosqlc-core';
import MemoryClient from './MemoryClient.js';

export default class MemoryDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:memory:';

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
