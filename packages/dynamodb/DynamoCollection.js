/**
 * DynamoCollection — DynamoDB Collection implementation.
 *
 * Uses @aws-sdk/lib-dynamodb DocumentClient for plain JS marshalling.
 * Table name = collection name (must exist — created by DynamoClient during connect).
 *
 * Primary key: { _pk: string } — a simple string partition key.
 * No sort key. This keeps the abstraction uniform across store/get/delete.
 *
 * insert() generates a string id (no auto-increment in DynamoDB).
 * find() uses a Scan with FilterExpression.
 */
import { Collection, Cursor } from '@alt-javascript/jsnosqlc-core';
import { GetCommand, PutCommand, DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import DynamoFilterTranslator from './DynamoFilterTranslator.js';

export default class DynamoCollection extends Collection {
  /**
   * @param {DynamoClient} client
   * @param {string} name — collection / table name
   * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} docClient
   */
  constructor(client, name, docClient) {
    super(client, name);
    this._docClient = docClient;
  }

  async _get(key) {
    const resp = await this._docClient.send(new GetCommand({
      TableName: this._name,
      Key: { _pk: key },
    }));
    return resp.Item ?? null;
  }

  async _store(key, doc) {
    await this._docClient.send(new PutCommand({
      TableName: this._name,
      Item: { ...doc, _pk: key },
    }));
  }

  async _delete(key) {
    await this._docClient.send(new DeleteCommand({
      TableName: this._name,
      Key: { _pk: key },
    }));
  }

  async _insert(doc) {
    const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
    await this._docClient.send(new PutCommand({
      TableName: this._name,
      Item: { ...doc, _pk: id, _id: id },
    }));
    return id;
  }

  async _update(key, patch) {
    // Build UpdateExpression from patch keys
    const names = {};
    const values = {};
    const setParts = [];
    let idx = 0;

    for (const [k, v] of Object.entries(patch)) {
      if (k === '_pk') continue; // skip primary key
      const nk = `#u${idx}`;
      const vk = `:u${idx}`;
      names[nk] = k;
      values[vk] = v;
      setParts.push(`${nk} = ${vk}`);
      idx++;
    }

    if (setParts.length === 0) return;

    await this._docClient.send(new UpdateCommand({
      TableName: this._name,
      Key: { _pk: key },
      UpdateExpression: `SET ${setParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }));
  }

  async _find(ast) {
    const { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      DynamoFilterTranslator.translate(ast);

    const params = { TableName: this._name };
    if (FilterExpression) params.FilterExpression = FilterExpression;
    if (ExpressionAttributeNames) params.ExpressionAttributeNames = ExpressionAttributeNames;
    if (ExpressionAttributeValues) params.ExpressionAttributeValues = ExpressionAttributeValues;

    // Handle DynamoDB pagination (LastEvaluatedKey)
    const allItems = [];
    let lastKey;
    do {
      if (lastKey) params.ExclusiveStartKey = lastKey;
      const resp = await this._docClient.send(new ScanCommand(params));
      if (resp.Items) allItems.push(...resp.Items);
      lastKey = resp.LastEvaluatedKey;
    } while (lastKey);

    return new Cursor(allItems);
  }
}
