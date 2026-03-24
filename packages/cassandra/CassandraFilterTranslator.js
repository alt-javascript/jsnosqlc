/**
 * CassandraFilterTranslator — Converts a jsnosqlc Filter AST to CQL WHERE clause.
 *
 * Schema: CREATE TABLE col (pk text PRIMARY KEY, data text)
 * Documents are stored as JSON in the 'data' column.
 *
 * CQL supports WHERE on the primary key (pk) natively, but filtering on JSON
 * fields inside 'data' is not possible in CQL. For non-pk filters, we fall
 * back to client-side filtering.
 *
 * Strategy for M2:
 *   - If the filter only touches 'pk' (the primary key), emit CQL WHERE.
 *   - For all other field filters, return a clientSideOnly flag and use
 *     MemoryFilterEvaluator on all fetched documents.
 *   - This is correct but not scalable. Document accordingly.
 *
 * CQL native operators (pk only): eq, gt, gte, lt, lte, in
 * Client-side only: ne, contains, nin, exists, and any non-pk field
 */
export default class CassandraFilterTranslator {
  /**
   * @param {Object} ast
   * @returns {{ cql: string|null, params: Array, clientSideOnly: boolean }}
   */
  static translate(ast) {
    if (!ast || (ast.type === 'and' && ast.conditions?.length === 0)) {
      return { cql: null, params: [], clientSideOnly: false };
    }

    // Check if we can do native CQL (pk equality only — fastest path)
    const pkEq = CassandraFilterTranslator._extractPkEq(ast);
    if (pkEq !== undefined) {
      return { cql: 'pk = ?', params: [pkEq], clientSideOnly: false };
    }

    // All other cases: full scan + client-side filter
    return { cql: null, params: [], clientSideOnly: true };
  }

  /**
   * If the AST is a single eq condition on 'pk' or '_pk', return the value.
   * Otherwise return undefined.
   */
  static _extractPkEq(ast) {
    if (ast.type === 'condition' && (ast.field === 'pk' || ast.field === '_pk') && ast.op === 'eq') {
      return ast.value;
    }
    return undefined;
  }
}
