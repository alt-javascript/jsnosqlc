/**
 * compliance.spec.js — Runs the shared driver compliance suite against Redis.
 *
 * Requires Redis:
 *   docker run --rm -d --name jsnoslqc-redis -p 6379:6379 redis:7
 *
 * ⚠ NOTE: find() in the Redis driver performs a full collection scan + in-memory
 *   filter. This is not production-scalable. Consider RediSearch for production
 *   filter queries.
 *
 * Skips all tests gracefully if Redis is not reachable.
 */
import { describe, it, before, after } from 'mocha';
import { runCompliance } from '@alt-javascript/jsnoslqc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnoslqc-core';
import RedisDriver from '../RedisDriver.js';

const REDIS_URL = process.env.REDIS_URL ?? 'jsnoslqc:redis://localhost:6379';
let redisAvailable = false;
let pingClient = null;

describe('Redis driver — connectivity check', function () {
  this.timeout(8000);

  before(async () => {
    try {
      DriverManager.clear();
      DriverManager.registerDriver(new RedisDriver());
      pingClient = await DriverManager.getClient(REDIS_URL);
      const col = pingClient.getCollection('_ping');
      await col.store('ping', { ok: true });
      redisAvailable = true;
    } catch (err) {
      console.warn(`\n  ⚠  Redis not available — skipping compliance tests`);
      console.warn(`     ${err.message}\n`);
      redisAvailable = false;
    } finally {
      if (pingClient) {
        await pingClient.close().catch(() => {});
        pingClient = null;
      }
    }
  });

  it('Redis is reachable (skip signal)', function () {
    if (!redisAvailable) this.skip();
  });
});

describe('Redis driver compliance (integration)', function () {
  this.timeout(15000);

  before(function () {
    if (!redisAvailable) this.skip();
  });

  runCompliance(async () => {
    if (!redisAvailable) return null;
    DriverManager.clear();
    DriverManager.registerDriver(new RedisDriver());
    const client = await DriverManager.getClient(REDIS_URL);

    // Flush the test database to start clean
    const redis = client._redis;
    await redis.flushdb();

    return client;
  });
});
