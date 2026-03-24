/**
 * compliance.spec.js — Runs the shared driver compliance suite against Firestore.
 *
 * Requires the Firestore emulator:
 *   docker run --rm -d --name jsnosqlc-firestore \
 *     -e FIRESTORE_PROJECT_ID=jsnoslqc-test -e PORT=8080 \
 *     -p 8080:8080 mtlynch/firestore-emulator
 *
 * Environment:
 *   FIRESTORE_EMULATOR_HOST — defaults to localhost:8080
 *   FIRESTORE_PROJECT_ID    — defaults to jsnoslqc-test
 *
 * Skips all tests gracefully if Firestore emulator is not reachable.
 */
import { describe, it, before } from 'mocha';
import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnosqlc-core';
import FirestoreDriver from '../FirestoreDriver.js';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
const PROJECT_ID = process.env.FIRESTORE_PROJECT_ID ?? 'jsnoslqc-test';
const URL = `jsnosqlc:firestore:${PROJECT_ID}`;

let firestoreAvailable = false;

describe('Firestore driver — connectivity check', function () {
  this.timeout(15000);

  before(async () => {
    // Set emulator env var for the SDK
    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;

    try {
      DriverManager.clear();
      DriverManager.registerDriver(new FirestoreDriver());
      const client = await DriverManager.getClient(URL);
      const col = client.getCollection('_ping');
      await col.store('ping', { ok: true });
      await client.close();
      firestoreAvailable = true;
    } catch (err) {
      console.warn(`\n  ⚠  Firestore emulator not available at ${EMULATOR_HOST} — skipping compliance tests`);
      console.warn(`     ${err.message}\n`);
      firestoreAvailable = false;
    }
  });

  it('Firestore emulator is reachable (skip signal)', function () {
    if (!firestoreAvailable) this.skip();
  });
});

describe('Firestore driver compliance (integration)', function () {
  this.timeout(30000);

  before(function () {
    if (!firestoreAvailable) this.skip();
  });

  runCompliance(async () => {
    if (!firestoreAvailable) return null;
    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
    DriverManager.clear();
    DriverManager.registerDriver(new FirestoreDriver());
    return DriverManager.getClient(URL);
  });
});
