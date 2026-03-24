/**
 * MongoDriver — MongoDB jsnosqlc driver.
 *
 * Handles URLs with prefix: jsnosqlc:mongodb://
 * Strips the jsnosqlc: prefix and passes the remainder to the native MongoDB client.
 *
 * URL format: jsnosqlc:mongodb://host:port/database
 * e.g. jsnosqlc:mongodb://localhost:27017/myapp
 *
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnosqlc-core';
import { MongoClient as NativeMongoClient } from 'mongodb';
import MongoClient from './MongoClient.js';

export default class MongoDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith('jsnosqlc:mongodb://');
  }

  async connect(url, properties = {}) {
    // Strip 'jsnosqlc:' prefix → gives us 'mongodb://host:port/database'
    const nativeUrl = url.substring('jsnosqlc:'.length);

    // Extract database name from URL path
    const urlObj = new URL(nativeUrl);
    const dbName = urlObj.pathname.replace(/^\//, '') || 'test';

    // Build connection URL without the db path (MongoClient connects to the server,
    // then we select the db separately)
    const serverUrl = `${urlObj.protocol}//${urlObj.host}`;

    const options = {
      serverSelectionTimeoutMS: properties.serverSelectionTimeoutMS ?? 5000,
    };
    if (properties.username) options.auth = { username: properties.username, password: properties.password };

    const nativeClient = new NativeMongoClient(serverUrl, options);
    await nativeClient.connect();

    const db = nativeClient.db(dbName);
    return new MongoClient(url, nativeClient, db);
  }
}

// Auto-register on import
const _driver = new MongoDriver();
DriverManager.registerDriver(_driver);

export { MongoClient, _driver };
