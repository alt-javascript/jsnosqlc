# T02: Filter Builder and AST

**Slice:** S01
**Milestone:** M001

## Goal

Implement the chainable `Filter.where()` builder, `FieldCondition` with all 10 operators, and the filter AST. Unit-test the builder to confirm correct AST production.

## Must-Haves

### Truths
- `Filter.where('age').gt(18).build()` returns `{ type: 'condition', field: 'age', op: 'gt', value: 18 }`
- `.and('name').eq('Alice')` chains correctly: result is `{ type: 'and', conditions: [ ...age cond..., ...name cond... ] }`
- All 10 operators build correctly: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `nin`, `exists`
- `Filter.where(field)` always starts a fresh filter (no shared state between calls)
- `filter.spec.js` tests all operators and chaining — all pass

### Artifacts
- `packages/core/Filter.js` — static `where(field)` factory, holds root condition, `and(field)` chains, `build()` returns AST
- `packages/core/FieldCondition.js` — holds field name + reference back to Filter; each operator method stores op+value then returns the Filter for further chaining
- `packages/core/test/filter.spec.js` — mocha unit tests for builder

### Key Links
- `Filter.where()` → returns `FieldCondition` which holds a back-reference to the `Filter` instance
- `FieldCondition.eq()` (and all operators) → stores condition, returns `Filter` (for `.and()` chaining)
- `Filter.build()` → serializes internal condition list to AST

## Steps

1. Design AST node shapes:
   - Leaf: `{ type: 'condition', field, op, value }` (value is undefined for `exists`)
   - Compound: `{ type: 'and', conditions: [ ...leaves ] }` (M1 only needs `and`; `or` is M2)
2. Write `packages/core/FieldCondition.js` with all 10 operator methods
3. Write `packages/core/Filter.js` with `where()`, `and()`, `build()`
4. Update `packages/core/index.js` to export `Filter` and `FieldCondition`
5. Write `packages/core/test/filter.spec.js` covering all operators and chaining scenarios
6. Run `npm test` in `packages/core` — all filter tests pass

## Context

- Filter is a pure data structure — no database calls, no async. Tests are fully synchronous.
- The AST is the contract between the builder and driver translators (MongoDB, DynamoDB).
  Keep it simple — driver translators will do the heavy lifting.
- Chaining design: `Filter.where(f)` creates `new Filter()` + `new FieldCondition(f, filter)`.
  Operator methods on `FieldCondition` call `filter._addCondition(cond)` then return the filter.
  `filter.and(f)` creates a new `FieldCondition(f, filter)` and returns it.
  `filter.build()` wraps conditions: single → return as-is; multiple → wrap in `{type:'and', conditions:[...]}`.
