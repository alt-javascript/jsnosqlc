/**
 * compliance.spec.js — Runs the shared driver compliance suite against the memory driver.
 */
import { runCompliance } from '@alt-javascript/jsnoslqc-core/test/driverCompliance.js';
import { DriverManager } from '@alt-javascript/jsnoslqc-core';
import MemoryDriver from '../MemoryDriver.js';

runCompliance(async () => {
  DriverManager.clear();
  DriverManager.registerDriver(new MemoryDriver());
  return DriverManager.getClient('jsnoslqc:memory:');
});
