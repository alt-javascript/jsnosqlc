/**
 * DynamoDriver — DynamoDB jsnoslqc driver.
 *
 * URL format: jsnoslqc:dynamodb:<region>
 * e.g. jsnoslqc:dynamodb:us-east-1
 *
 * For DynamoDB Local (testing): set endpoint via properties or env:
 *   properties.endpoint = 'http://localhost:8000'
 *   or DYNAMODB_ENDPOINT env var
 *
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnoslqc-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import DynamoClient from './DynamoClient.js';

export default class DynamoDriver extends Driver {
  static URL_PREFIX = 'jsnoslqc:dynamodb:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(DynamoDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    const region = url.substring(DynamoDriver.URL_PREFIX.length) || 'us-east-1';

    const config = { region };

    // Support DynamoDB Local via endpoint override
    const endpoint = properties.endpoint ?? process.env.DYNAMODB_ENDPOINT;
    if (endpoint) {
      config.endpoint = endpoint;
    }

    if (properties.accessKeyId) {
      config.credentials = {
        accessKeyId: properties.accessKeyId,
        secretAccessKey: properties.secretAccessKey,
      };
    }

    const nativeClient = new DynamoDBClient(config);
    const docClient = DynamoDBDocumentClient.from(nativeClient, {
      marshallOptions: { removeUndefinedValues: true },
    });

    return new DynamoClient(url, nativeClient, docClient);
  }
}

// Auto-register on import
const _driver = new DynamoDriver();
DriverManager.registerDriver(_driver);

export { DynamoClient, _driver };
