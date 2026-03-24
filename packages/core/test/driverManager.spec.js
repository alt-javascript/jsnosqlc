import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import DriverManager from '../DriverManager.js';
import Driver from '../Driver.js';
import Client from '../Client.js';
import Collection from '../Collection.js';
import Cursor from '../Cursor.js';

// Minimal stub driver + client for DriverManager tests
class StubCollection extends Collection {
  async _get(key) { return { key }; }
  async _store(key, doc) {}
  async _delete(key) {}
  async _insert(doc) { return 'stub-id'; }
  async _update(key, patch) {}
  async _find(filter) { return new Cursor([]); }
}

class StubClient extends Client {
  _getCollection(name) { return new StubCollection(this, name); }
}

class StubDriver extends Driver {
  constructor(prefix) {
    super();
    this._prefix = prefix;
  }
  acceptsURL(url) { return url.startsWith(this._prefix); }
  async connect(url, props) { return new StubClient({ url }); }
}

describe('DriverManager', () => {
  beforeEach(() => {
    DriverManager.clear();
  });

  it('starts empty', () => {
    assert.deepEqual(DriverManager.getDrivers(), []);
  });

  it('registers a driver', () => {
    const d = new StubDriver('jsnosqlc:stub:');
    DriverManager.registerDriver(d);
    assert.equal(DriverManager.getDrivers().length, 1);
  });

  it('does not double-register the same instance', () => {
    const d = new StubDriver('jsnosqlc:stub:');
    DriverManager.registerDriver(d);
    DriverManager.registerDriver(d);
    assert.equal(DriverManager.getDrivers().length, 1);
  });

  it('deregisters a driver', () => {
    const d = new StubDriver('jsnosqlc:stub:');
    DriverManager.registerDriver(d);
    DriverManager.deregisterDriver(d);
    assert.equal(DriverManager.getDrivers().length, 0);
  });

  it('getClient routes to the correct driver', async () => {
    const dA = new StubDriver('jsnosqlc:a:');
    const dB = new StubDriver('jsnosqlc:b:');
    DriverManager.registerDriver(dA);
    DriverManager.registerDriver(dB);
    const client = await DriverManager.getClient('jsnosqlc:b:test');
    assert.instanceOf(client, StubClient);
    assert.equal(client.getUrl(), 'jsnosqlc:b:test');
  });

  it('getClient throws when no driver matches', async () => {
    DriverManager.registerDriver(new StubDriver('jsnosqlc:x:'));
    await assert.isRejected
      ? assert.isRejected(DriverManager.getClient('jsnosqlc:unknown:test'))
      : await DriverManager.getClient('jsnosqlc:unknown:test').then(
          () => { throw new Error('should have thrown'); },
          (err) => { assert.include(err.message, 'No suitable driver'); }
        );
  });

  it('clear resets the registry', () => {
    DriverManager.registerDriver(new StubDriver('jsnosqlc:a:'));
    DriverManager.clear();
    assert.deepEqual(DriverManager.getDrivers(), []);
  });

  it('getDrivers returns a copy, not the internal array', () => {
    const d = new StubDriver('jsnosqlc:a:');
    DriverManager.registerDriver(d);
    const drivers = DriverManager.getDrivers();
    drivers.pop();
    assert.equal(DriverManager.getDrivers().length, 1);
  });
});
