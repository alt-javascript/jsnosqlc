/**
 * index.js — Public exports for @alt-javascript/jsnosqlc-localstorage
 *
 * Re-exports the full core API alongside localstorage-specific classes so that
 * browser consumers can import everything they need from a single bundle:
 *
 *   import { DriverManager, Filter } from './jsnosqlc-localstorage.esm.js';
 */

// Core re-exports — available to browser consumers without a separate import
export {
  Driver,
  Client,
  ClientDataSource,
  Collection,
  Cursor,
  DriverManager,
  Filter,
  FieldCondition,
  UnsupportedOperationError,
} from '@alt-javascript/jsnosqlc-core';

// LocalStorage-specific exports
export {
  LocalStorageDriver,
  SessionStorageDriver,
  _localDriver,
  _sessionDriver,
} from './LocalStorageDriver.js';
export { default as LocalStorageClient } from './LocalStorageClient.js';
export { default as LocalStorageCollection } from './LocalStorageCollection.js';
export { default as MockStorage } from './MockStorage.js';
export { default as MemoryFilterEvaluator } from './MemoryFilterEvaluator.js';
