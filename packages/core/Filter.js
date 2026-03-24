/**
 * Filter — Chainable query filter builder.
 *
 * Usage:
 *   const filter = Filter.where('age').gt(18).and('name').eq('Alice');
 *   const ast = filter.build();
 *   // { type: 'and', conditions: [
 *   //   { type: 'condition', field: 'age', op: 'gt', value: 18 },
 *   //   { type: 'condition', field: 'name', op: 'eq', value: 'Alice' }
 *   // ]}
 *
 * AST node shapes:
 *   Leaf:     { type: 'condition', field: string, op: string, value: * }
 *   Compound: { type: 'and', conditions: ConditionNode[] }
 */
import FieldCondition from './FieldCondition.js';

export default class Filter {
  constructor() {
    this._conditions = [];
  }

  /**
   * Start a new filter with the given field.
   * @param {string} field
   * @returns {FieldCondition}
   */
  static where(field) {
    const filter = new Filter();
    return new FieldCondition(field, filter);
  }

  /**
   * Chain an additional condition on a new field.
   * @param {string} field
   * @returns {FieldCondition}
   */
  and(field) {
    return new FieldCondition(field, this);
  }

  /**
   * Build and return the filter AST.
   *
   * Single condition → returns the leaf node directly.
   * Multiple conditions → wraps in { type: 'and', conditions: [...] }.
   *
   * @returns {Object} AST node
   */
  build() {
    if (this._conditions.length === 0) {
      return { type: 'and', conditions: [] };
    }
    if (this._conditions.length === 1) {
      return { ...this._conditions[0] };
    }
    return { type: 'and', conditions: this._conditions.map((c) => ({ ...c })) };
  }

  /** @internal — called by FieldCondition */
  _addCondition(node) {
    this._conditions.push(node);
  }
}
