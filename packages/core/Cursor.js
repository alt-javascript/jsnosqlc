/**
 * Cursor — Represents the result of a find() operation.
 *
 * Provides cursor-based iteration (next/getDocument) plus bulk access
 * (getDocuments) and implements the async iterator protocol for use with
 * `for await...of`.
 *
 * Base class holds a row array. Driver implementations may override to
 * support streaming from the database instead of buffering all results.
 */
export default class Cursor {
  /**
   * @param {Object[]} [documents] — buffered result array (optional for streaming subclasses)
   */
  constructor(documents = []) {
    this._documents = documents;
    this._cursor = -1;
    this._closed = false;
  }

  /**
   * Advance cursor to the next document.
   * @returns {Promise<boolean>} true if there is a current document
   */
  async next() {
    this._checkClosed();
    this._cursor++;
    return this._cursor < this._documents.length;
  }

  /**
   * Get the document at the current cursor position.
   * @returns {Object}
   */
  getDocument() {
    this._checkClosed();
    this._checkCursor();
    return { ...this._documents[this._cursor] };
  }

  /**
   * Get all documents as an array without cursor iteration.
   * @returns {Object[]}
   */
  getDocuments() {
    this._checkClosed();
    return this._documents.map((d) => ({ ...d }));
  }

  /** Close the cursor and release resources. */
  async close() {
    this._closed = true;
  }

  /** @returns {boolean} */
  isClosed() {
    return this._closed;
  }

  /** Async iterator protocol — enables `for await (const doc of cursor)` */
  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        const hasMore = await this.next();
        if (hasMore) {
          return { value: this.getDocument(), done: false };
        }
        await this.close();
        return { value: undefined, done: true };
      },
    };
  }

  _checkClosed() {
    if (this._closed) throw new Error('Cursor is closed');
  }

  _checkCursor() {
    if (this._cursor < 0 || this._cursor >= this._documents.length) {
      throw new Error('Cursor is not on a valid document — call next() first');
    }
  }
}
