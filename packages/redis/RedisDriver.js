/**
 * RedisDriver — Redis jsnoslqc driver via ioredis.
 *
 * URL formats:
 *   jsnoslqc:redis://localhost:6379
 *   jsnoslqc:redis://localhost:6379/0       (database index)
 *   jsnoslqc:redis://:password@localhost:6379
 *
 * The 'jsnoslqc:' prefix is stripped and the remainder passed to ioredis.
 *
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnoslqc-core';
import Redis from 'ioredis';
import RedisClient from './RedisClient.js';

export default class RedisDriver extends Driver {
  static URL_PREFIX = 'jsnoslqc:redis:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(RedisDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    // Strip 'jsnoslqc:' → leaves 'redis://...' or 'redis:host:port'
    const nativeUrl = url.substring('jsnoslqc:'.length);

    const options = {
      lazyConnect: false,
      enableReadyCheck: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      ...properties,
    };

    const redis = new Redis(nativeUrl, options);

    // Wait for connection or throw
    await new Promise((resolve, reject) => {
      redis.once('ready', resolve);
      redis.once('error', reject);
    });

    return new RedisClient(url, redis);
  }
}

// Auto-register on import
const _driver = new RedisDriver();
DriverManager.registerDriver(_driver);

export { RedisClient, _driver };
