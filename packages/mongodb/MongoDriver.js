/**
 * MongoDriver — MongoDB jsnoslqc driver.
 *
 * Handles URLs with prefix: jsnoslqc:mongodb://
 * Strips the jsnoslqc: prefix and passes the remainder to the native MongoDB client.
 *
 * URL format: jsnoslqc:mongodb://host:port/database
 * e.g. jsnoslqc:mongodb://localhost:27017/myapp
 *
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnoslqc-core';
import { MongoClient as NativeMongoClient } from 'mongodb';
import MongoClient from './MongoClient.js';

export default class MongoDriver extends Driver {
  static URL_PREFIX = 'jsnoslqc:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith('jsnoslqc:mongodb://');
  }

  async connect(url, properties = {}) {
    // Strip 'jsnoslqc:' prefix → gives us 'mongodb://host:port/database'
    const nativeUrl = url.substring('jsnoslqc:'.length);

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
