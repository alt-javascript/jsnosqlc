/**
 * FirestoreClient — Google Firestore Client implementation.
 */
import { Client } from '@alt-javascript/jsnosqlc-core';
import FirestoreCollection from './FirestoreCollection.js';

export default class FirestoreClient extends Client {
  /**
   * @param {string} url — jsnosqlc URL
   * @param {import('@google-cloud/firestore').Firestore} firestore
   */
  constructor(url, firestore) {
    super({ url });
    this._firestore = firestore;
  }

  _getCollection(name) {
    return new FirestoreCollection(this, name, this._firestore.collection(name));
  }

  async _close() {
    // @google-cloud/firestore has no explicit close() in all versions; terminate() if available
    if (typeof this._firestore.terminate === 'function') {
      await this._firestore.terminate();
    }
  }
}
