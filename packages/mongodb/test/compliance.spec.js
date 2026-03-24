/**
 * compliance.spec.js — Runs the shared driver compliance suite against MongoDB.
 *
 * Requires a MongoDB instance. Set MONGODB_URL env var or defaults to
 * jsnoslqc:mongodb://localhost:27017/jsnoslqc_test
 *
 * Skips all tests gracefully if MongoDB is not reachable.
 */
import { describe, it, before, after } from 'mocha';
import { assert } from 'chai';
import { runCompliance } from '@alt-javascript/jsnoslqc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnoslqc-core';
import MongoDriver from '../MongoDriver.js';

const MONGO_URL = process.env.MONGODB_URL ?? 'jsnoslqc:mongodb://localhost:27017/jsnoslqc_test';

// Check connectivity before running the full suite
let mongoAvailable = false;
let skipClient = null;

describe('MongoDB driver — connectivity check', function () {
  this.timeout(8000);

  before(async () => {
    DriverManager.clear();
    DriverManager.registerDriver(new MongoDriver());
    try {
      skipClient = await DriverManager.getClient(MONGO_URL);
      // Try a simple ping
      const col = skipClient.getCollection('_ping');
      await col.store('ping', { ok: true });
      await skipClient.close();
      mongoAvailable = true;
    } catch (err) {
      console.warn(`\n  ⚠  MongoDB not available at ${MONGO_URL} — skipping compliance tests`);
      console.warn(`     ${err.message}\n`);
      mongoAvailable = false;
    }
  });

  it('MongoDB is reachable (skip signal)', function () {
    if (!mongoAvailable) this.skip();
  });
});

// Only register the compliance suite if MongoDB is available
// We use a lazy describe that evaluates after the connectivity check
describe('MongoDB driver compliance (integration)', function () {
  this.timeout(10000);

  before(function () {
    if (!mongoAvailable) this.skip();
  });

  runCompliance(async () => {
    if (!mongoAvailable) return null;
    DriverManager.clear();
    DriverManager.registerDriver(new MongoDriver());
    const client = await DriverManager.getClient(MONGO_URL);
    // Drop test collections to start clean
    const rawClient = client._nativeClient;
    const db = client._db;
    await db.collection('compliance_test').drop().catch(() => {});
    await db.collection('compliance_find').drop().catch(() => {});
    return client;
  });
});
