/**
 * DriverManager — Registry for jsnosqlc drivers.
 *
 * Drivers register themselves on import. When getClient() is called,
 * DriverManager iterates registered drivers to find one that accepts the URL.
 */
export default class DriverManager {
  static _drivers = [];

  /**
   * Register a driver instance.
   * @param {Driver} driver
   */
  static registerDriver(driver) {
    if (!DriverManager._drivers.includes(driver)) {
      DriverManager._drivers.push(driver);
    }
  }

  /**
   * Remove a driver.
   * @param {Driver} driver
   */
  static deregisterDriver(driver) {
    DriverManager._drivers = DriverManager._drivers.filter((d) => d !== driver);
  }

  /**
   * Get a client from the first driver that accepts the URL.
   * @param {string} url — jsnosqlc URL
   * @param {Object} [properties] — connection properties
   * @returns {Promise<Client>}
   */
  static async getClient(url, properties = {}) {
    for (const driver of DriverManager._drivers) {
      if (driver.acceptsURL(url)) {
        return driver.connect(url, properties);
      }
    }
    throw new Error(`No suitable driver found for URL: ${url}`);
  }

  /**
   * Get all registered drivers.
   * @returns {Driver[]}
   */
  static getDrivers() {
    return [...DriverManager._drivers];
  }

  /** Clear all registered drivers (for testing). */
  static clear() {
    DriverManager._drivers = [];
  }
}
