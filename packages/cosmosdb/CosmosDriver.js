/**
 * CosmosDriver — Azure Cosmos DB jsnoslqc driver.
 *
 * URL formats:
 *   jsnosqlc:cosmosdb:local                  — local emulator (http://localhost:8081)
 *   jsnosqlc:cosmosdb:https://account.documents.azure.com:443/
 *
 * The emulator uses a well-known key. For real Azure, supply via properties:
 *   { key: 'your-account-key' }
 *
 * Emulator TLS: self-signed cert. For Node.js testing, set:
 *   NODE_TLS_REJECT_UNAUTHORIZED=0
 * before running tests, or pass { rejectUnauthorized: false } via properties.
 *
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnosqlc-core';
import { CosmosClient as NativeCosmosClient } from '@azure/cosmos';
import CosmosClient from './CosmosClient.js';

// Emulator well-known key
const EMULATOR_KEY = 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
const EMULATOR_ENDPOINT = 'https://localhost:8081';

export default class CosmosDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:cosmosdb:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(CosmosDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    const target = url.substring(CosmosDriver.URL_PREFIX.length);
    const isLocal = target === 'local' || target === 'localhost' || target.startsWith('localhost:');

    let endpoint, key;

    if (isLocal) {
      endpoint = properties.endpoint ?? 'http://localhost:8081';
      key = properties.key ?? EMULATOR_KEY;
    } else {
      endpoint = target.startsWith('https://') ? target : `https://${target}`;
      key = properties.key;
      if (!key) throw new Error('CosmosDB driver: properties.key is required for non-emulator connections');
    }

    const clientOptions = { endpoint, key };

    // For HTTPS emulator variants with self-signed certs, disable TLS verification
    if ((isLocal && endpoint.startsWith('https://')) || properties.rejectUnauthorized === false) {
      clientOptions.agent = new (await import('node:https')).Agent({ rejectUnauthorized: false });
    }

    const nativeClient = new NativeCosmosClient(clientOptions);

    const dbId = properties.database ?? 'jsnoslqc';
    const { database } = await nativeClient.databases.createIfNotExists({ id: dbId });

    return new CosmosClient(url, nativeClient, database);
  }
}

// Auto-register on import
const _driver = new CosmosDriver();
DriverManager.registerDriver(_driver);

export { CosmosClient, _driver };
