/**
 * index.js — Public exports for @alt-javascript/jsnosqlc-memory
 *
 * Re-exports the full core API alongside memory-specific classes so that
 * browser consumers can import everything they need from a single bundle:
 *
 *   import { DriverManager, Filter } from './jsnosqlc-memory.esm.js';
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

// Memory-specific exports
export { default as MemoryDriver, MemoryClient, _driver } from './MemoryDriver.js';
export { default as MemoryCollection } from './MemoryCollection.js';
export { default as MemoryFilterEvaluator } from './MemoryFilterEvaluator.js';
