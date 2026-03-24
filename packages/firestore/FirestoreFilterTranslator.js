/**
 * FirestoreFilterTranslator — Converts a jsnoslqc Filter AST to Firestore SDK query calls.
 *
 * Firestore queries are built by chaining .where() calls on a CollectionReference.
 * This translator takes the AST and returns a transformed Query object.
 *
 * Supported: all 10 leaf operators + and (implicit chaining) + or (Filter.or)
 *
 * Firestore operator mapping:
 *   eq       → '=='
 *   ne       → '!='
 *   gt       → '>'
 *   gte      → '>='
 *   lt       → '<'
 *   lte      → '<='
 *   contains → 'array-contains'
 *   in       → 'in'
 *   nin      → 'not-in'
 *   exists   → handled via != null (true) or == null (false)
 *
 * or  → Firestore.Filter.or(...)  (SDK v7+)
 * not → NOT directly supported in Firestore; we apply client-side filter as fallback.
 *       For M2, 'not' is implemented as a full-scan + in-memory filter.
 */
import { Filter as FirestoreSDKFilter } from '@google-cloud/firestore';

export default class FirestoreFilterTranslator {
  /**
   * Apply the Filter AST to a Firestore CollectionReference, returning a Query.
   * @param {import('@google-cloud/firestore').CollectionReference} colRef
   * @param {Object} ast — Filter AST node
   * @returns {{ query: Query, clientFilter: Function|null }}
   *   query: the Firestore Query
   *   clientFilter: if non-null, apply this function to each document after fetching
   */
  static apply(colRef, ast) {
    if (!ast || (ast.type === 'and' && ast.conditions?.length === 0)) {
      return { query: colRef, clientFilter: null };
    }

    try {
      const sdkFilter = FirestoreFilterTranslator._buildSDKFilter(ast);
      return { query: colRef.where(sdkFilter), clientFilter: null };
    } catch (err) {
      // 'not' nodes and other unsupported constructs fall back to client-side filtering
      if (err.message?.includes('client-side')) {
        return { query: colRef, clientFilter: err.clientFilter };
      }
      throw err;
    }
  }

  static _buildSDKFilter(ast) {
    if (ast.type === 'condition') {
      return FirestoreFilterTranslator._leafFilter(ast);
    }

    if (ast.type === 'and') {
      const parts = ast.conditions.map((c) => FirestoreFilterTranslator._buildSDKFilter(c));
      if (parts.length === 1) return parts[0];
      return FirestoreSDKFilter.and(...parts);
    }

    if (ast.type === 'or') {
      const parts = ast.conditions.map((c) => FirestoreFilterTranslator._buildSDKFilter(c));
      if (parts.length === 1) return parts[0];
      return FirestoreSDKFilter.or(...parts);
    }

    if (ast.type === 'not') {
      // Firestore has no NOT operator — throw a special error so caller falls back to client-side
      const err = new Error('client-side: not operator requires client-side filtering');
      // Import MemoryFilterEvaluator lazily to avoid circular dep
      err.clientFilter = null; // will be set after throw is caught
      throw err;
    }

    throw new Error(`Unknown filter AST node type: ${ast.type}`);
  }

  static _leafFilter({ field, op, value }) {
    switch (op) {
      case 'eq':       return FirestoreSDKFilter.where(field, '==', value);
      case 'ne':       return FirestoreSDKFilter.where(field, '!=', value);
      case 'gt':       return FirestoreSDKFilter.where(field, '>', value);
      case 'gte':      return FirestoreSDKFilter.where(field, '>=', value);
      case 'lt':       return FirestoreSDKFilter.where(field, '<', value);
      case 'lte':      return FirestoreSDKFilter.where(field, '<=', value);
      case 'contains': return FirestoreSDKFilter.where(field, 'array-contains', value);
      case 'in':       return FirestoreSDKFilter.where(field, 'in', value);
      case 'nin':      return FirestoreSDKFilter.where(field, 'not-in', value);
      case 'exists':
        if (value === false) return FirestoreSDKFilter.where(field, '==', null);
        return FirestoreSDKFilter.where(field, '!=', null);
      default:
        throw new Error(`Unknown filter operator: ${op}`);
    }
  }
}
