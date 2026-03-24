/**
 * Filter — Chainable query filter builder.
 *
 * Usage:
 *   const filter = Filter.where('age').gt(18).and('name').eq('Alice');
 *   const ast = filter.build();
 *
 * Compound operators:
 *   Filter.or(filter1, filter2)  → { type: 'or', conditions: [ast1, ast2] }
 *   Filter.where('age').gt(18).not()  → { type: 'not', condition: ast }
 *
 * AST node shapes:
 *   Leaf:     { type: 'condition', field: string, op: string, value: * }
 *   And:      { type: 'and', conditions: ConditionNode[] }
 *   Or:       { type: 'or',  conditions: ConditionNode[] }
 *   Not:      { type: 'not', condition: ConditionNode }
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
   * Create an OR compound of two or more already-built filter ASTs.
   * Each argument should be a built AST node (the result of filter.build())
   * or a Filter instance (build() is called automatically).
   *
   * @param {...(Object|Filter)} filters — AST nodes or Filter instances
   * @returns {Object} { type: 'or', conditions: [...] }
   */
  static or(...filters) {
    const conditions = filters.map((f) =>
      f instanceof Filter ? f.build() : f
    );
    return { type: 'or', conditions };
  }

  /**
   * Chain an additional AND condition on a new field.
   * @param {string} field
   * @returns {FieldCondition}
   */
  and(field) {
    return new FieldCondition(field, this);
  }

  /**
   * Negate this filter.
   * Calls build() internally and wraps the result in a not node.
   * @returns {Object} { type: 'not', condition: ast }
   */
  not() {
    return { type: 'not', condition: this.build() };
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
