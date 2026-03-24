/**
 * DynamoFilterTranslator — Converts a jsnosqlc Filter AST to DynamoDB
 * FilterExpression syntax.
 *
 * DynamoDB requires:
 *   - ExpressionAttributeNames: { '#n0': 'fieldName', ... }  (avoid reserved words)
 *   - ExpressionAttributeValues: { ':v0': { S: 'value' }, ... }
 *   - FilterExpression: '#n0 = :v0 AND #n1 > :v1'
 *
 * Usage:
 *   const result = DynamoFilterTranslator.translate(ast);
 *   // result: { FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues }
 *
 * Supported operators:
 *   eq, ne, gt, gte, lt, lte, contains, in, nin, exists
 */
export default class DynamoFilterTranslator {
  /**
   * @param {Object} ast — Filter AST
   * @returns {{ FilterExpression: string, ExpressionAttributeNames: Object, ExpressionAttributeValues: Object }}
   */
  static translate(ast) {
    const ctx = {
      names: {},    // '#n0' → 'fieldName'
      values: {},   // ':v0' → DynamoDB AttributeValue
      nameIdx: 0,
      valueIdx: 0,
    };

    const expr = DynamoFilterTranslator._translate(ast, ctx);

    return {
      FilterExpression: expr || undefined,
      ExpressionAttributeNames: Object.keys(ctx.names).length ? ctx.names : undefined,
      ExpressionAttributeValues: Object.keys(ctx.values).length ? ctx.values : undefined,
    };
  }

  static _translate(ast, ctx) {
    if (!ast) return null;

    if (ast.type === 'and') {
      if (!ast.conditions || ast.conditions.length === 0) return null;
      const parts = ast.conditions.map((c) => DynamoFilterTranslator._translate(c, ctx)).filter(Boolean);
      if (parts.length === 0) return null;
      if (parts.length === 1) return parts[0];
      return parts.map((p) => `(${p})`).join(' AND ');
    }

    if (ast.type === 'or') {
      if (!ast.conditions || ast.conditions.length === 0) return null;
      const parts = ast.conditions.map((c) => DynamoFilterTranslator._translate(c, ctx)).filter(Boolean);
      if (parts.length === 0) return null;
      if (parts.length === 1) return parts[0];
      return parts.map((p) => `(${p})`).join(' OR ');
    }

    if (ast.type === 'not') {
      const inner = DynamoFilterTranslator._translate(ast.condition, ctx);
      if (!inner) return null;
      return `NOT (${inner})`;
    }

    if (ast.type === 'condition') {
      return DynamoFilterTranslator._translateCondition(ast, ctx);
    }

    throw new Error(`Unknown filter AST node type: ${ast.type}`);
  }

  static _translateCondition({ field, op, value }, ctx) {
    const nameKey = `#n${ctx.nameIdx++}`;
    ctx.names[nameKey] = field;

    switch (op) {
      case 'eq': {
        const valKey = DynamoFilterTranslator._addValue(ctx, value);
        return `${nameKey} = ${valKey}`;
      }
      case 'ne': {
        const valKey = DynamoFilterTranslator._addValue(ctx, value);
        return `${nameKey} <> ${valKey}`;
      }
      case 'gt': {
        const valKey = DynamoFilterTranslator._addValue(ctx, value);
        return `${nameKey} > ${valKey}`;
      }
      case 'gte': {
        const valKey = DynamoFilterTranslator._addValue(ctx, value);
        return `${nameKey} >= ${valKey}`;
      }
      case 'lt': {
        const valKey = DynamoFilterTranslator._addValue(ctx, value);
        return `${nameKey} < ${valKey}`;
      }
      case 'lte': {
        const valKey = DynamoFilterTranslator._addValue(ctx, value);
        return `${nameKey} <= ${valKey}`;
      }
      case 'contains': {
        // DynamoDB contains() works for string contains and set/list membership
        const valKey = DynamoFilterTranslator._addValue(ctx, value);
        return `contains(${nameKey}, ${valKey})`;
      }
      case 'in': {
        // DynamoDB has no $in — build OR of equality checks
        if (!Array.isArray(value) || value.length === 0) return null;
        const parts = value.map((v) => {
          const vk = DynamoFilterTranslator._addValue(ctx, v);
          return `${nameKey} = ${vk}`;
        });
        return `(${parts.join(' OR ')})`;
      }
      case 'nin': {
        // NOT IN — build AND of not-equal checks
        if (!Array.isArray(value) || value.length === 0) return null;
        const parts = value.map((v) => {
          const vk = DynamoFilterTranslator._addValue(ctx, v);
          return `${nameKey} <> ${vk}`;
        });
        return `(${parts.join(' AND ')})`;
      }
      case 'exists': {
        if (value === false) {
          return `attribute_not_exists(${nameKey})`;
        }
        return `attribute_exists(${nameKey})`;
      }
      default:
        throw new Error(`Unknown filter operator: ${op}`);
    }
  }

  /**
   * Adds a JavaScript value to the expression values map.
   * Returns the placeholder key (e.g. ':v0').
   * Uses @aws-sdk/lib-dynamodb marshalling (plain JS values — the DocumentClient handles conversion).
   */
  static _addValue(ctx, value) {
    const key = `:v${ctx.valueIdx++}`;
    ctx.values[key] = value;
    return key;
  }
}
