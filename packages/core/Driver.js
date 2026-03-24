/**
 * Driver — Creates client connections to a specific NoSQL database type.
 *
 * Each driver implementation registers itself with DriverManager on import
 * and declares which URL schemes it handles.
 *
 * URL scheme: jsnosqlc:<subprotocol>:<connection-details>
 * e.g. jsnosqlc:mongodb://localhost:27017/mydb
 *      jsnosqlc:memory:
 *      jsnosqlc:dynamodb:us-east-1
 */
export default class Driver {
  /**
   * Check if this driver handles the given jsnoslqc URL.
   * @param {string} url — e.g. 'jsnosqlc:mongodb://localhost:27017/mydb'
   * @returns {boolean}
   */
  acceptsURL(url) {
    return false;
  }

  /**
   * Create a client connection to the database.
   * @param {string} url — jsnoslqc URL
   * @param {Object} [properties] — { username, password, ...driverSpecific }
   * @returns {Promise<Client>}
   */
  async connect(url, properties = {}) {
    throw new Error('Not implemented');
  }
}
