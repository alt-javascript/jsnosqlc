/**
 * compliance.spec.js — Runs the shared driver compliance suite against DynamoDB.
 *
 * Requires DynamoDB Local or real AWS DynamoDB.
 *
 * Environment:
 *   DYNAMODB_ENDPOINT — defaults to http://localhost:8000 (DynamoDB Local)
 *   DYNAMODB_REGION   — defaults to us-east-1
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY — required for real AWS
 *     (DynamoDB Local accepts any value, e.g. 'local' / 'local')
 *
 * Skips all tests gracefully if DynamoDB is not reachable.
 */
import { describe, it, before } from 'mocha';
import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnosqlc-core';
import DynamoDriver from '../DynamoDriver.js';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';
const REGION = process.env.DYNAMODB_REGION ?? 'us-east-1';
const URL = `jsnosqlc:dynamodb:${REGION}`;

let dynamoAvailable = false;

describe('DynamoDB driver — connectivity check', function () {
  this.timeout(10000);

  before(async () => {
    // Use dummy creds for DynamoDB Local
    const testClient = new DynamoDBClient({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    });

    try {
      await testClient.send(new ListTablesCommand({}));
      dynamoAvailable = true;
    } catch (err) {
      console.warn(`\n  ⚠  DynamoDB not available at ${ENDPOINT} — skipping compliance tests`);
      console.warn(`     ${err.message}\n`);
      dynamoAvailable = false;
    } finally {
      testClient.destroy();
    }
  });

  it('DynamoDB is reachable (skip signal)', function () {
    if (!dynamoAvailable) this.skip();
  });
});

describe('DynamoDB driver compliance (integration)', function () {
  this.timeout(30000);

  before(function () {
    if (!dynamoAvailable) this.skip();
  });

  runCompliance(async () => {
    if (!dynamoAvailable) return null;

    DriverManager.clear();
    DriverManager.registerDriver(new DynamoDriver());

    const client = await DriverManager.getClient(URL, {
      endpoint: ENDPOINT,
      accessKeyId: 'local',
      secretAccessKey: 'local',
    });

    return client;
  });
});
