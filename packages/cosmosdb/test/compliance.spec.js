/**
 * compliance.spec.js — Runs the shared driver compliance suite against Azure Cosmos DB.
 *
 * Requires the Cosmos DB Linux emulator (vnext-preview):
 *   docker run --rm -d --name jsnoslqc-cosmosdb \
 *     -p 8081:8081 -p 1234:1234 \
 *     mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
 *
 * The emulator uses self-signed TLS. NODE_TLS_REJECT_UNAUTHORIZED=0 is set here
 * for test purposes — never do this in production.
 *
 * Skips all tests gracefully if Cosmos DB emulator is not reachable.
 */
import { describe, it, before } from 'mocha';
import { runCompliance } from '@alt-javascript/jsnoslqc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnoslqc-core';
import CosmosDriver from '../CosmosDriver.js';

// Allow self-signed TLS for the emulator
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const COSMOS_URL = 'jsnoslqc:cosmosdb:local';
let cosmosAvailable = false;

describe('Cosmos DB driver — connectivity check', function () {
  this.timeout(20000);

  before(async () => {
    try {
      DriverManager.clear();
      DriverManager.registerDriver(new CosmosDriver());
      const client = await DriverManager.getClient(COSMOS_URL, { database: 'jsnoslqc_ci' });
      const col = client.getCollection('_ping');
      await col.store('ping', { ok: true });
      await client.close();
      cosmosAvailable = true;
    } catch (err) {
      console.warn(`\n  ⚠  Cosmos DB emulator not available — skipping compliance tests`);
      console.warn(`     ${err.message}\n`);
      cosmosAvailable = false;
    }
  });

  it('Cosmos DB emulator is reachable (skip signal)', function () {
    if (!cosmosAvailable) this.skip();
  });
});

describe('Cosmos DB driver compliance (integration)', function () {
  this.timeout(30000);

  before(function () {
    if (!cosmosAvailable) this.skip();
  });

  runCompliance(async () => {
    if (!cosmosAvailable) return null;
    DriverManager.clear();
    DriverManager.registerDriver(new CosmosDriver());
    return DriverManager.getClient(COSMOS_URL, { database: 'jsnoslqc_ci' });
  });
});
