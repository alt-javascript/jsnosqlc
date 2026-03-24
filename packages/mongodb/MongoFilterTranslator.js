/**
 * MongoFilterTranslator — Converts a jsnosqlc Filter AST to a MongoDB query document.
 *
 * Handles:
 *   Leaf:     { type: 'condition', field, op, value }
 *   And:      { type: 'and', conditions: [...] }
 *   Or:       { type: 'or',  conditions: [...] }
 *   Not:      { type: 'not', condition: ... }
 *
 * Operator mapping:
 *   eq       → { field: { $eq: value } }
 *   ne       → { field: { $ne: value } }
 *   gt       → { field: { $gt: value } }
 *   gte      → { field: { $gte: value } }
 *   lt       → { field: { $lt: value } }
 *   lte      → { field: { $lte: value } }
 *   contains → { field: value }  (MongoDB native array element match)
 *   in       → { field: { $in: values } }
 *   nin      → { field: { $nin: values } }
 *   exists   → { field: { $exists: bool } }
 */
export default class MongoFilterTranslator {
  /**
   * Translate a Filter AST to a MongoDB query document.
   * @param {Object} ast — Filter AST node
   * @returns {Object} MongoDB query document
   */
  static translate(ast) {
    if (!ast) return {};

    if (ast.type === 'and') {
      if (!ast.conditions || ast.conditions.length === 0) return {};
      const parts = ast.conditions.map((c) => MongoFilterTranslator.translate(c));
      if (parts.length === 1) return parts[0];
      return { $and: parts };
    }

    if (ast.type === 'or') {
      if (!ast.conditions || ast.conditions.length === 0) return {};
      const parts = ast.conditions.map((c) => MongoFilterTranslator.translate(c));
      if (parts.length === 1) return parts[0];
      return { $or: parts };
    }

    if (ast.type === 'not') {
      // MongoDB $nor: [cond] is equivalent to NOT cond for a single condition
      const inner = MongoFilterTranslator.translate(ast.condition);
      return { $nor: [inner] };
    }

    if (ast.type === 'condition') {
      return MongoFilterTranslator._translateCondition(ast);
    }

    throw new Error(`Unknown filter AST node type: ${ast.type}`);
  }

  static _translateCondition({ field, op, value }) {
    const mongoField = field === 'id' ? '_id' : field;

    switch (op) {
      case 'eq':
        return { [mongoField]: { $eq: value } };

      case 'ne':
        return { [mongoField]: { $ne: value } };

      case 'gt':
        return { [mongoField]: { $gt: value } };

      case 'gte':
        return { [mongoField]: { $gte: value } };

      case 'lt':
        return { [mongoField]: { $lt: value } };

      case 'lte':
        return { [mongoField]: { $lte: value } };

      case 'contains':
        // MongoDB natively matches { field: value } against array elements.
        // For string substring, use $regex explicitly (out of scope for M1/M2 compliance tests).
        return { [mongoField]: value };

      case 'in':
        return { [mongoField]: { $in: value } };

      case 'nin':
        return { [mongoField]: { $nin: value } };

      case 'exists':
        return { [mongoField]: { $exists: value } };

      default:
        throw new Error(`Unknown filter operator: ${op}`);
    }
  }
}
