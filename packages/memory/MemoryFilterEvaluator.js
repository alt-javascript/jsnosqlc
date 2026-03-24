/**
 * MemoryFilterEvaluator — Applies a Filter AST to an in-memory document.
 *
 * Handles:
 *   Leaf:  { type: 'condition', field, op, value }
 *   And:   { type: 'and', conditions: [...] }
 *   Or:    { type: 'or',  conditions: [...] }
 *   Not:   { type: 'not', condition: ... }
 *
 * Supported operators: eq, ne, gt, gte, lt, lte, contains, in, nin, exists
 */
export default class MemoryFilterEvaluator {
  /**
   * Test whether a document matches the given filter AST.
   * @param {Object} doc
   * @param {Object} ast — Filter AST node
   * @returns {boolean}
   */
  static matches(doc, ast) {
    if (!ast) return true;

    if (ast.type === 'and') {
      if (!ast.conditions || ast.conditions.length === 0) return true;
      return ast.conditions.every((c) => MemoryFilterEvaluator.matches(doc, c));
    }

    if (ast.type === 'or') {
      if (!ast.conditions || ast.conditions.length === 0) return false;
      return ast.conditions.some((c) => MemoryFilterEvaluator.matches(doc, c));
    }

    if (ast.type === 'not') {
      return !MemoryFilterEvaluator.matches(doc, ast.condition);
    }

    if (ast.type === 'condition') {
      return MemoryFilterEvaluator._evalCondition(doc, ast);
    }

    throw new Error(`Unknown filter AST node type: ${ast.type}`);
  }

  static _evalCondition(doc, { field, op, value }) {
    const fieldValue = MemoryFilterEvaluator._resolve(doc, field);

    switch (op) {
      case 'eq':
        return fieldValue === value;

      case 'ne':
        return fieldValue !== value;

      case 'gt':
        return fieldValue != null && fieldValue > value;

      case 'gte':
        return fieldValue != null && fieldValue >= value;

      case 'lt':
        return fieldValue != null && fieldValue < value;

      case 'lte':
        return fieldValue != null && fieldValue <= value;

      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(value);
        }
        return false;

      case 'in':
        if (!Array.isArray(value)) return false;
        return value.includes(fieldValue);

      case 'nin':
        if (!Array.isArray(value)) return true;
        return !value.includes(fieldValue);

      case 'exists':
        if (value === false) {
          return fieldValue === undefined || fieldValue === null;
        }
        return fieldValue !== undefined && fieldValue !== null;

      default:
        throw new Error(`Unknown filter operator: ${op}`);
    }
  }

  /**
   * Resolve a (potentially dot-notation) field path from a document.
   * e.g. 'address.city' → doc.address.city
   */
  static _resolve(doc, field) {
    if (!field.includes('.')) {
      return doc[field];
    }
    return field.split('.').reduce((obj, key) => (obj != null ? obj[key] : undefined), doc);
  }
}
