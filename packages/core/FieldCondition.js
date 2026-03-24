/**
 * FieldCondition — Represents a field-level condition within a Filter.
 *
 * Created by Filter.where(field) or Filter.and(field). Operator methods
 * store the condition into the parent Filter and return the Filter for
 * further chaining.
 *
 * Supported operators: eq, ne, gt, gte, lt, lte, contains, in, nin, exists
 */
export default class FieldCondition {
  /**
   * @param {string} field — field name
   * @param {import('./Filter.js').default} filter — owning Filter instance
   */
  constructor(field, filter) {
    this._field = field;
    this._filter = filter;
  }

  /** Equal: field === value */
  eq(value) { return this._add('eq', value); }

  /** Not equal: field !== value */
  ne(value) { return this._add('ne', value); }

  /** Greater than: field > value */
  gt(value) { return this._add('gt', value); }

  /** Greater than or equal: field >= value */
  gte(value) { return this._add('gte', value); }

  /** Less than: field < value */
  lt(value) { return this._add('lt', value); }

  /** Less than or equal: field <= value */
  lte(value) { return this._add('lte', value); }

  /**
   * Contains: field contains value (string substring or array element).
   * For arrays: field contains the given element.
   * For strings: field contains the given substring.
   */
  contains(value) { return this._add('contains', value); }

  /** In: field is one of values[] */
  in(values) { return this._add('in', values); }

  /** Not in: field is not one of values[] */
  nin(values) { return this._add('nin', values); }

  /**
   * Exists: field is present (and not null/undefined) when value is true,
   * or absent/null/undefined when value is false.
   * @param {boolean} [value=true]
   */
  exists(value = true) { return this._add('exists', value); }

  _add(op, value) {
    this._filter._addCondition({ type: 'condition', field: this._field, op, value });
    return this._filter;
  }
}
