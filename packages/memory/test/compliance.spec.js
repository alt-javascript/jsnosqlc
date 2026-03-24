/**
 * compliance.spec.js — Runs the shared driver compliance suite against the memory driver.
 */
import { runCompliance } from '@alt-javascript/jsnosqlc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnosqlc-core';
import MemoryDriver from '../MemoryDriver.js';

runCompliance(async () => {
  DriverManager.clear();
  DriverManager.registerDriver(new MemoryDriver());
  return DriverManager.getClient('jsnosqlc:memory:');
});
