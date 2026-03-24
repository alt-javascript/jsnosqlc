/**
 * compliance.spec.js — Runs the shared driver compliance suite against Cassandra.
 *
 * Requires Cassandra:
 *   docker run --rm -d --name jsnoslqc-cassandra -p 9042:9042 cassandra:4
 *
 * Cassandra takes 30-60 seconds to become ready after container start.
 *
 * ⚠ NOTE: find() in the Cassandra driver performs a full table scan + in-memory
 *   filter for non-pk queries. This is not production-scalable. Model your
 *   tables to support your access patterns in production.
 *
 * Skips all tests gracefully if Cassandra is not reachable.
 */
import { describe, it, before } from 'mocha';
import { runCompliance } from '@alt-javascript/jsnoslqc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnoslqc-core';
import CassandraDriver from '../CassandraDriver.js';

const CASSANDRA_URL = process.env.CASSANDRA_URL ?? 'jsnoslqc:cassandra:localhost:9042/jsnoslqc_test';
let cassandraAvailable = false;

describe('Cassandra driver — connectivity check', function () {
  this.timeout(60000);

  before(async () => {
    try {
      DriverManager.clear();
      DriverManager.registerDriver(new CassandraDriver());
      const client = await DriverManager.getClient(CASSANDRA_URL);
      const col = client.getCollection('_ping');
      await col.store('ping', { ok: true });
      await client.close();
      cassandraAvailable = true;
    } catch (err) {
      console.warn(`\n  ⚠  Cassandra not available — skipping compliance tests`);
      console.warn(`     ${err.message?.slice(0, 120)}\n`);
      cassandraAvailable = false;
    }
  });

  it('Cassandra is reachable (skip signal)', function () {
    if (!cassandraAvailable) this.skip();
  });
});

describe('Cassandra driver compliance (integration)', function () {
  this.timeout(60000);

  before(function () {
    if (!cassandraAvailable) this.skip();
  });

  runCompliance(async () => {
    if (!cassandraAvailable) return null;
    DriverManager.clear();
    DriverManager.registerDriver(new CassandraDriver());
    return DriverManager.getClient(CASSANDRA_URL);
  });
});
