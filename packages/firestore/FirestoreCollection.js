/**
 * FirestoreCollection — Google Firestore Collection implementation.
 *
 * Maps jsnosqlc operations to Firestore SDK calls.
 *
 * Key/ID strategy:
 *   - store(key, doc): uses doc.ref = colRef.doc(key); set()
 *   - get(key): colRef.doc(key).get()
 *   - delete(key): colRef.doc(key).delete()
 *   - insert(doc): colRef.add(doc) → returns auto-generated id
 *   - update(key, patch): colRef.doc(key).update(patch)
 *   - find(ast): colRef.where(...).get()
 *
 * Note: Firestore documents are identified by their document ID, not a '_pk' field.
 * The id returned by insert() is the Firestore document ID string.
 */
import { Collection, Cursor } from '@alt-javascript/jsnosqlc-core';
import FirestoreFilterTranslator from './FirestoreFilterTranslator.js';
import MemoryFilterEvaluator from '@alt-javascript/jsnosqlc-memory/MemoryFilterEvaluator.js';

export default class FirestoreCollection extends Collection {
  /**
   * @param {FirestoreClient} client
   * @param {string} name — collection name
   * @param {import('@google-cloud/firestore').CollectionReference} colRef
   */
  constructor(client, name, colRef) {
    super(client, name);
    this._colRef = colRef;
  }

  async _get(key) {
    const snap = await this._colRef.doc(key).get();
    if (!snap.exists) return null;
    return { ...snap.data(), _id: snap.id };
  }

  async _store(key, doc) {
    await this._colRef.doc(key).set({ ...doc });
  }

  async _delete(key) {
    await this._colRef.doc(key).delete();
  }

  async _insert(doc) {
    const ref = await this._colRef.add({ ...doc });
    return ref.id;
  }

  async _update(key, patch) {
    await this._colRef.doc(key).update(patch);
  }

  async _find(ast) {
    const { query, clientFilter } = FirestoreFilterTranslator.apply(this._colRef, ast);
    const snap = await query.get();
    let docs = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));

    // Apply client-side filter for unsupported constructs (e.g. 'not')
    if (clientFilter) {
      docs = docs.filter((doc) => MemoryFilterEvaluator.matches(doc, ast));
    }

    return new Cursor(docs);
  }
}
