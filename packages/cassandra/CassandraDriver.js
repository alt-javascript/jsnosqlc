/**
 * CassandraDriver — Apache Cassandra jsnosqlc driver.
 *
 * URL format: jsnosqlc:cassandra:<host>:<port>/<keyspace>
 * e.g. jsnosqlc:cassandra:localhost:9042/jsnosqlc
 *
 * The keyspace is created automatically if it doesn't exist (SimpleStrategy,
 * replication_factor: 1 — suitable for local/test use).
 *
 * Auto-registers with DriverManager on import.
 */
import { Driver, DriverManager } from '@alt-javascript/jsnosqlc-core';
import cassandraDriver from 'cassandra-driver';
import CassandraClient from './CassandraClient.js';

const { Client: NativeCassandraClient } = cassandraDriver;

export default class CassandraDriver extends Driver {
  static URL_PREFIX = 'jsnosqlc:cassandra:';

  acceptsURL(url) {
    return typeof url === 'string' && url.startsWith(CassandraDriver.URL_PREFIX);
  }

  async connect(url, properties = {}) {
    // Parse: jsnosqlc:cassandra:localhost:9042/keyspace
    const rest = url.substring(CassandraDriver.URL_PREFIX.length);
    const slashIdx = rest.indexOf('/');
    const hostPort = slashIdx >= 0 ? rest.substring(0, slashIdx) : rest;
    const keyspace = slashIdx >= 0 ? rest.substring(slashIdx + 1) : 'jsnosqlc';
    const [host, portStr] = hostPort.split(':');
    const port = portStr ? parseInt(portStr, 10) : 9042;

    const contactPoints = properties.contactPoints ?? [`${host}:${port}`];

    // Connect without keyspace first to create it
    const adminClient = new NativeCassandraClient({
      contactPoints,
      localDataCenter: properties.localDataCenter ?? 'datacenter1',
      protocolOptions: { port },
      socketOptions: { connectTimeout: 10000 },
    });

    await adminClient.connect();

    // Create keyspace if needed
    await adminClient.execute(
      `CREATE KEYSPACE IF NOT EXISTS "${keyspace}" ` +
      `WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`
    );
    await adminClient.shutdown();

    // Reconnect with keyspace
    const client = new NativeCassandraClient({
      contactPoints,
      localDataCenter: properties.localDataCenter ?? 'datacenter1',
      keyspace,
      protocolOptions: { port },
      socketOptions: { connectTimeout: 10000 },
    });

    await client.connect();
    return new CassandraClient(url, client);
  }
}

// Auto-register on import
const _driver = new CassandraDriver();
DriverManager.registerDriver(_driver);

export { CassandraClient, _driver };
