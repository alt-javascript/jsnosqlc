/**
 * errors.js — Custom error classes for jsnosqlc.
 */

/**
 * Thrown when a driver does not implement an optional Collection operation.
 * Callers can `instanceof`-check this to handle gracefully.
 */
export class UnsupportedOperationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedOperationError';
  }
}
