/**
 * DynamoClient — DynamoDB Client implementation.
 *
 * Creates tables on demand using a simple schema:
 *   - Partition key: _pk (String)
 *   - No sort key
 *   - BillingMode: PAY_PER_REQUEST (on-demand)
 *
 * Table names = collection names. Tables are created the first time
 * getCollection() is called for a name that doesn't exist yet.
 */
import { Client } from '@alt-javascript/jsnosqlc-core';
import DynamoCollection from './DynamoCollection.js';
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ResourceInUseException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export default class DynamoClient extends Client {
  /**
   * @param {string} url — original jsnoslqc URL
   * @param {DynamoDBClient} nativeClient
   * @param {DynamoDBDocumentClient} docClient
   */
  constructor(url, nativeClient, docClient) {
    super({ url });
    this._nativeClient = nativeClient;
    this._docClient = docClient;
    this._ensuredTables = new Set();
  }

  _getCollection(name) {
    // Note: table creation is async, but _getCollection() must be synchronous.
    // We return the collection immediately and let the first operation trigger
    // table creation lazily. Alternatively, call ensureTable() before returning.
    // For simplicity, we wrap in a proxy collection that ensures the table exists.
    return new LazyDynamoCollection(this, name, this._docClient);
  }

  /**
   * Ensure a DynamoDB table exists with the _pk schema.
   * Safe to call multiple times — caches results.
   * @param {string} tableName
   */
  async ensureTable(tableName) {
    if (this._ensuredTables.has(tableName)) return;

    try {
      await this._nativeClient.send(new DescribeTableCommand({ TableName: tableName }));
      this._ensuredTables.add(tableName);
    } catch (err) {
      if (err.name === 'ResourceNotFoundException') {
        await this._nativeClient.send(new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [{ AttributeName: '_pk', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: '_pk', KeyType: 'HASH' }],
          BillingMode: 'PAY_PER_REQUEST',
        }));
        // Wait until active
        let active = false;
        for (let i = 0; i < 30; i++) {
          const desc = await this._nativeClient.send(new DescribeTableCommand({ TableName: tableName }));
          if (desc.Table.TableStatus === 'ACTIVE') { active = true; break; }
          await new Promise((r) => setTimeout(r, 500));
        }
        if (!active) throw new Error(`Table ${tableName} did not become ACTIVE`);
        this._ensuredTables.add(tableName);
      } else {
        throw err;
      }
    }
  }

  async _close() {
    this._nativeClient.destroy();
  }
}

/**
 * LazyDynamoCollection — ensures the table exists before the first operation.
 */
class LazyDynamoCollection extends DynamoCollection {
  constructor(client, name, docClient) {
    super(client, name, docClient);
    this._tableEnsured = false;
  }

  async _ensureTable() {
    if (!this._tableEnsured) {
      await this._client.ensureTable(this._name);
      this._tableEnsured = true;
    }
  }

  async _get(key) { await this._ensureTable(); return super._get(key); }
  async _store(key, doc) { await this._ensureTable(); return super._store(key, doc); }
  async _delete(key) { await this._ensureTable(); return super._delete(key); }
  async _insert(doc) { await this._ensureTable(); return super._insert(doc); }
  async _update(key, patch) { await this._ensureTable(); return super._update(key, patch); }
  async _find(ast) { await this._ensureTable(); return super._find(ast); }
}
