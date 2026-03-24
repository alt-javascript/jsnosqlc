/**
 * FirestoreDriver — Google Firestore jsnoslqc driver.
 *
 * URL format: jsnoslqc:firestore:<project-id>
 * e.g. jsnoslqc:firestore:my-gcp-project
 *
 * Emulator support:
 *   Set FIRESTORE_EMULATOR_HOST=localhost:8080 to redirect to local emulator.
 *   The @google-cloud/firestore SDK detects this env var automatically.
 *
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnoslqc-core';
import { Firestore } from '@google-cloud/firestore';
import FirestoreClient from './FirestoreClient.js';

export default class FirestoreDriver extends Driver {
  static URL_PREFIX = 'jsnoslqc:firestore:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(FirestoreDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    const projectId = url.substring(FirestoreDriver.URL_PREFIX.length) || 'default';

    const config = { projectId };

    // If credentials are provided explicitly (for non-emulator use)
    if (properties.keyFilename) {
      config.keyFilename = properties.keyFilename;
    } else if (properties.credentials) {
      config.credentials = properties.credentials;
    }
    // If FIRESTORE_EMULATOR_HOST is set, the SDK uses it automatically — no extra config needed.

    const firestore = new Firestore(config);
    return new FirestoreClient(url, firestore);
  }
}

// Auto-register on import
const _driver = new FirestoreDriver();
DriverManager.registerDriver(_driver);

export { FirestoreClient, _driver };
