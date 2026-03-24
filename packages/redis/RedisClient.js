/**
 * RedisClient — Redis Client implementation.
 */
import { Client } from '@alt-javascript/jsnosqlc-core';
import RedisCollection from './RedisCollection.js';

export default class RedisClient extends Client {
  /**
   * @param {string} url — jsnoslqc URL
   * @param {import('ioredis').Redis} redis — connected ioredis instance
   */
  constructor(url, redis) {
    super({ url });
    this._redis = redis;
  }

  _getCollection(name) {
    return new RedisCollection(this, name, this._redis);
  }

  async _close() {
    await this._redis.quit();
  }
}
