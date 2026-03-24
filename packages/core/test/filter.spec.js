import { describe, it } from 'mocha';
import { assert } from 'chai';
import Filter from '../Filter.js';

describe('Filter builder', () => {
  describe('single conditions', () => {
    it('eq — builds correct leaf', () => {
      const ast = Filter.where('name').eq('Alice').build();
      assert.deepEqual(ast, { type: 'condition', field: 'name', op: 'eq', value: 'Alice' });
    });

    it('ne — builds correct leaf', () => {
      const ast = Filter.where('status').ne('inactive').build();
      assert.deepEqual(ast, { type: 'condition', field: 'status', op: 'ne', value: 'inactive' });
    });

    it('gt — builds correct leaf', () => {
      const ast = Filter.where('age').gt(18).build();
      assert.deepEqual(ast, { type: 'condition', field: 'age', op: 'gt', value: 18 });
    });

    it('gte — builds correct leaf', () => {
      const ast = Filter.where('score').gte(100).build();
      assert.deepEqual(ast, { type: 'condition', field: 'score', op: 'gte', value: 100 });
    });

    it('lt — builds correct leaf', () => {
      const ast = Filter.where('price').lt(50).build();
      assert.deepEqual(ast, { type: 'condition', field: 'price', op: 'lt', value: 50 });
    });

    it('lte — builds correct leaf', () => {
      const ast = Filter.where('rating').lte(5).build();
      assert.deepEqual(ast, { type: 'condition', field: 'rating', op: 'lte', value: 5 });
    });

    it('contains — builds correct leaf', () => {
      const ast = Filter.where('tags').contains('js').build();
      assert.deepEqual(ast, { type: 'condition', field: 'tags', op: 'contains', value: 'js' });
    });

    it('in — builds correct leaf', () => {
      const ast = Filter.where('status').in(['active', 'pending']).build();
      assert.deepEqual(ast, { type: 'condition', field: 'status', op: 'in', value: ['active', 'pending'] });
    });

    it('nin — builds correct leaf', () => {
      const ast = Filter.where('status').nin(['deleted', 'banned']).build();
      assert.deepEqual(ast, { type: 'condition', field: 'status', op: 'nin', value: ['deleted', 'banned'] });
    });

    it('exists (true) — builds correct leaf', () => {
      const ast = Filter.where('email').exists(true).build();
      assert.deepEqual(ast, { type: 'condition', field: 'email', op: 'exists', value: true });
    });

    it('exists (false) — builds correct leaf', () => {
      const ast = Filter.where('deletedAt').exists(false).build();
      assert.deepEqual(ast, { type: 'condition', field: 'deletedAt', op: 'exists', value: false });
    });

    it('exists defaults to true', () => {
      const ast = Filter.where('email').exists().build();
      assert.deepEqual(ast, { type: 'condition', field: 'email', op: 'exists', value: true });
    });
  });

  describe('compound conditions', () => {
    it('two conditions wrap in and', () => {
      const ast = Filter.where('age').gt(18).and('name').eq('Alice').build();
      assert.deepEqual(ast, {
        type: 'and',
        conditions: [
          { type: 'condition', field: 'age', op: 'gt', value: 18 },
          { type: 'condition', field: 'name', op: 'eq', value: 'Alice' },
        ],
      });
    });

    it('three conditions wrap in and', () => {
      const ast = Filter.where('age').gt(18)
        .and('status').eq('active')
        .and('country').eq('AU')
        .build();
      assert.deepEqual(ast, {
        type: 'and',
        conditions: [
          { type: 'condition', field: 'age', op: 'gt', value: 18 },
          { type: 'condition', field: 'status', op: 'eq', value: 'active' },
          { type: 'condition', field: 'country', op: 'eq', value: 'AU' },
        ],
      });
    });

    it('mixed operators compound correctly', () => {
      const ast = Filter.where('price').lt(100)
        .and('tags').contains('sale')
        .and('stock').gte(1)
        .build();
      assert.equal(ast.type, 'and');
      assert.equal(ast.conditions.length, 3);
      assert.equal(ast.conditions[1].op, 'contains');
    });
  });

  describe('isolation', () => {
    it('two separate Filter.where() calls do not share state', () => {
      const f1 = Filter.where('a').eq(1);
      const f2 = Filter.where('b').eq(2);
      assert.deepEqual(f1.build(), { type: 'condition', field: 'a', op: 'eq', value: 1 });
      assert.deepEqual(f2.build(), { type: 'condition', field: 'b', op: 'eq', value: 2 });
    });

    it('build() returns a copy, not a reference', () => {
      const filter = Filter.where('x').eq(42);
      const ast1 = filter.build();
      const ast2 = filter.build();
      ast1.value = 999;
      assert.equal(ast2.value, 42);
    });
  });

  describe('empty filter', () => {
    it('building a brand-new Filter instance gives empty and node', () => {
      const filter = new Filter();
      assert.deepEqual(filter.build(), { type: 'and', conditions: [] });
    });
  });

  describe('or compound', () => {
    it('Filter.or() with two AST nodes wraps in or', () => {
      const ast1 = Filter.where('status').eq('active').build();
      const ast2 = Filter.where('status').eq('pending').build();
      const or = Filter.or(ast1, ast2);
      assert.deepEqual(or, {
        type: 'or',
        conditions: [
          { type: 'condition', field: 'status', op: 'eq', value: 'active' },
          { type: 'condition', field: 'status', op: 'eq', value: 'pending' },
        ],
      });
    });

    it('Filter.or() accepts Filter instances and calls build() automatically', () => {
      const f1 = Filter.where('a').eq(1);
      const f2 = Filter.where('b').eq(2);
      const or = Filter.or(f1, f2);
      assert.equal(or.type, 'or');
      assert.equal(or.conditions.length, 2);
      assert.equal(or.conditions[0].field, 'a');
      assert.equal(or.conditions[1].field, 'b');
    });

    it('Filter.or() with three conditions', () => {
      const or = Filter.or(
        Filter.where('x').eq(1).build(),
        Filter.where('x').eq(2).build(),
        Filter.where('x').eq(3).build(),
      );
      assert.equal(or.type, 'or');
      assert.equal(or.conditions.length, 3);
    });
  });

  describe('not', () => {
    it('filter.not() wraps build() in a not node', () => {
      const not = Filter.where('status').eq('inactive').not();
      assert.deepEqual(not, {
        type: 'not',
        condition: { type: 'condition', field: 'status', op: 'eq', value: 'inactive' },
      });
    });

    it('compound filter not()', () => {
      const not = Filter.where('age').lt(18).and('status').ne('active').not();
      assert.equal(not.type, 'not');
      assert.equal(not.condition.type, 'and');
      assert.equal(not.condition.conditions.length, 2);
    });
  });
});
